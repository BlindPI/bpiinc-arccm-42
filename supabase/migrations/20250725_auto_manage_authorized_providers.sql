-- Auto-manage authorized_providers table based on profile role changes
-- This prevents duplicate provider records and ensures data consistency

-- Function to handle profile role changes
CREATE OR REPLACE FUNCTION handle_profile_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed TO 'AP', ensure provider record exists
  IF NEW.role = 'AP' AND (OLD.role IS NULL OR OLD.role != 'AP') THEN
    INSERT INTO authorized_providers (
      id,
      name,
      provider_type,
      status,
      contact_email,
      user_id,
      provider_name,
      assignment_type,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      COALESCE(NEW.display_name, NEW.email),
      'authorized_provider',
      'APPROVED',
      NEW.email,
      NEW.id,
      COALESCE(NEW.display_name, NEW.email),
      'location_based',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = COALESCE(NEW.display_name, NEW.email),
      contact_email = NEW.email,
      provider_name = COALESCE(NEW.display_name, NEW.email),
      updated_at = NOW();
      
    RAISE NOTICE 'Created/Updated authorized_provider for user % with role AP', NEW.id;
  END IF;

  -- If role changed FROM 'AP', deactivate provider record
  IF OLD.role = 'AP' AND NEW.role != 'AP' THEN
    UPDATE authorized_providers 
    SET 
      status = 'INACTIVE',
      updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RAISE NOTICE 'Deactivated authorized_provider for user % - role changed from AP to %', NEW.id, NEW.role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_profile_role_changes ON profiles;
CREATE TRIGGER trigger_profile_role_changes
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_role_changes();

-- Also handle INSERT for new AP users
CREATE OR REPLACE FUNCTION handle_new_ap_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'AP' THEN
    INSERT INTO authorized_providers (
      id,
      name,
      provider_type,
      status,
      contact_email,
      user_id,
      provider_name,
      assignment_type,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      COALESCE(NEW.display_name, NEW.email),
      'authorized_provider',
      'APPROVED',
      NEW.email,
      NEW.id,
      COALESCE(NEW.display_name, NEW.email),
      'location_based',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Created authorized_provider for new AP user %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
DROP TRIGGER IF EXISTS trigger_new_ap_users ON profiles;
CREATE TRIGGER trigger_new_ap_users
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_ap_users();

-- Add unique constraint to prevent duplicate user_id in authorized_providers
ALTER TABLE authorized_providers 
ADD CONSTRAINT unique_authorized_provider_user_id 
UNIQUE (user_id);

-- Clean up any remaining duplicates (keep the one with proper provider_type)
WITH duplicates AS (
  SELECT user_id, 
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY 
           CASE WHEN provider_type = 'authorized_provider' THEN 1 ELSE 2 END,
           created_at DESC
         ) as rn,
         id
  FROM authorized_providers 
  WHERE user_id IS NOT NULL
)
DELETE FROM authorized_providers 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

COMMENT ON FUNCTION handle_profile_role_changes() IS 'Automatically manages authorized_providers table when user roles change to/from AP';
COMMENT ON FUNCTION handle_new_ap_users() IS 'Automatically creates authorized_provider record for new AP users';