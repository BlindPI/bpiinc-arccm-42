-- Fix AP user location synchronization
-- This ensures AP users assigned to teams get proper location assignments

-- Function to sync AP user location when assigned to team
CREATE OR REPLACE FUNCTION sync_ap_user_location_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- When a team gets an AP user assigned
  IF NEW.assigned_ap_user_id IS NOT NULL AND NEW.location_id IS NOT NULL THEN
    -- Check if the AP user exists and update their location if needed
    UPDATE profiles 
    SET location_id = NEW.location_id,
        updated_at = NOW()
    WHERE id = NEW.assigned_ap_user_id 
      AND role = 'AP'
      AND (location_id IS NULL OR location_id != NEW.location_id);
    
    -- Ensure there's an authorized_provider record
    INSERT INTO authorized_providers (
      user_id,
      name,
      provider_name,
      provider_type,
      location_id,
      assignment_type,
      status,
      performance_rating,
      compliance_score,
      created_at,
      updated_at
    )
    SELECT 
      p.id,
      p.display_name,
      p.display_name,
      'authorized_provider',
      NEW.location_id,
      'location_based',
      'APPROVED',
      0,
      0,
      NOW(),
      NOW()
    FROM profiles p
    WHERE p.id = NEW.assigned_ap_user_id
      AND p.role = 'AP'
      AND NOT EXISTS (
        SELECT 1 FROM authorized_providers ap
        WHERE ap.user_id = NEW.assigned_ap_user_id
          AND ap.location_id = NEW.location_id
          AND ap.status = 'APPROVED'
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for team AP user assignment sync
DROP TRIGGER IF EXISTS trigger_sync_ap_user_location_assignment ON teams;
CREATE TRIGGER trigger_sync_ap_user_location_assignment
  AFTER INSERT OR UPDATE OF assigned_ap_user_id, location_id ON teams
  FOR EACH ROW
  EXECUTE FUNCTION sync_ap_user_location_assignment();

-- Function to fix existing AP user assignments
CREATE OR REPLACE FUNCTION fix_existing_ap_user_assignments()
RETURNS TEXT AS $$
DECLARE
  fixed_count INTEGER := 0;
  team_record RECORD;
BEGIN
  -- Fix teams with AP users but missing provider records
  FOR team_record IN 
    SELECT t.id, t.assigned_ap_user_id, t.location_id, p.display_name
    FROM teams t
    JOIN profiles p ON p.id = t.assigned_ap_user_id
    WHERE t.assigned_ap_user_id IS NOT NULL 
      AND t.location_id IS NOT NULL
      AND p.role = 'AP'
      AND NOT EXISTS (
        SELECT 1 FROM authorized_providers ap
        WHERE ap.user_id = t.assigned_ap_user_id
          AND ap.location_id = t.location_id
          AND ap.status = 'APPROVED'
      )
  LOOP
    -- Update AP user location
    UPDATE profiles 
    SET location_id = team_record.location_id,
        updated_at = NOW()
    WHERE id = team_record.assigned_ap_user_id 
      AND (location_id IS NULL OR location_id != team_record.location_id);
    
    -- Create authorized provider record
    INSERT INTO authorized_providers (
      user_id,
      name,
      provider_name,
      provider_type,
      location_id,
      assignment_type,
      status,
      performance_rating,
      compliance_score,
      created_at,
      updated_at
    ) VALUES (
      team_record.assigned_ap_user_id,
      team_record.display_name,
      team_record.display_name,
      'authorized_provider',
      team_record.location_id,
      'location_based',
      'APPROVED',
      0,
      0,
      NOW(),
      NOW()
    );
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RETURN 'Fixed ' || fixed_count || ' AP user assignment issues';
END;
$$ LANGUAGE plpgsql;

-- Run the fix for existing data
SELECT fix_existing_ap_user_assignments();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_ap_user_location_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_existing_ap_user_assignments() TO authenticated;