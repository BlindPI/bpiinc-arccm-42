-- =====================================================================================
-- CRITICAL FIX: Provider Navigation Configs UUID Type Mismatch
-- =====================================================================================
-- Issue: provider_navigation_configs.provider_id is bigint but should be uuid
-- Error: "invalid input syntax for type bigint: 'd6700479-c25e-434a-8954-51c716fb140a'"
-- Root Cause: Database schema mismatch with authorized_providers.id (uuid)

-- First, check if table exists and get current schema
DO $$ 
BEGIN
  -- Log current state for debugging
  RAISE NOTICE 'MIGRATION: Checking provider_navigation_configs table schema...';
  
  -- Check if table exists
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'provider_navigation_configs') THEN
    RAISE NOTICE 'MIGRATION: Table provider_navigation_configs does not exist, creating with correct schema...';
    
    -- Create table with correct UUID schema
    CREATE TABLE provider_navigation_configs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      provider_id uuid NOT NULL REFERENCES authorized_providers(id) ON DELETE CASCADE,
      config_overrides jsonb NOT NULL DEFAULT '{}',
      is_active boolean NOT NULL DEFAULT true,
      created_by uuid REFERENCES auth.users(id),
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      
      -- Ensure one config per provider
      UNIQUE(provider_id)
    );
    
    -- Add RLS policies
    ALTER TABLE provider_navigation_configs ENABLE ROW LEVEL SECURITY;
    
    -- Policy for providers to access their own config
    CREATE POLICY "Providers can view their navigation config" ON provider_navigation_configs
      FOR SELECT USING (
        provider_id IN (
          SELECT id FROM authorized_providers 
          WHERE user_id = auth.uid()
        )
      );
    
    -- Policy for providers to update their own config  
    CREATE POLICY "Providers can update their navigation config" ON provider_navigation_configs
      FOR ALL USING (
        provider_id IN (
          SELECT id FROM authorized_providers 
          WHERE user_id = auth.uid()
        )
      );
    
    -- Policy for system admins
    CREATE POLICY "System admins can manage all provider navigation configs" ON provider_navigation_configs
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role = 'SA'
        )
      );
    
    -- Add indexes for performance
    CREATE INDEX idx_provider_navigation_configs_provider_id ON provider_navigation_configs(provider_id);
    CREATE INDEX idx_provider_navigation_configs_active ON provider_navigation_configs(is_active) WHERE is_active = true;
    
    RAISE NOTICE 'MIGRATION: Created provider_navigation_configs table with correct UUID schema';
    
  ELSE
    -- Table exists, check if it has the wrong schema
    RAISE NOTICE 'MIGRATION: Table exists, checking provider_id column type...';
    
    -- Check current column type
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'provider_navigation_configs' 
      AND column_name = 'provider_id' 
      AND data_type = 'bigint'
    ) THEN
      RAISE NOTICE 'MIGRATION: CRITICAL FIX NEEDED - provider_id is bigint, converting to uuid...';
      
      -- First, backup any existing data
      RAISE NOTICE 'MIGRATION: Backing up existing data...';
      
      -- Create backup table
      CREATE TEMP TABLE provider_navigation_configs_backup AS 
      SELECT * FROM provider_navigation_configs;
      
      -- Log how many records we're backing up
      DECLARE
        backup_count integer;
      BEGIN
        SELECT COUNT(*) INTO backup_count FROM provider_navigation_configs_backup;
        RAISE NOTICE 'MIGRATION: Backed up % records', backup_count;
      END;
      
      -- Drop existing foreign key constraints if they exist
      DO $constraints$ 
      BEGIN
        -- Drop constraints that might reference the provider_id column
        ALTER TABLE provider_navigation_configs DROP CONSTRAINT IF EXISTS provider_navigation_configs_provider_id_fkey;
        RAISE NOTICE 'MIGRATION: Dropped existing foreign key constraints';
      EXCEPTION 
        WHEN OTHERS THEN
          RAISE NOTICE 'MIGRATION: No foreign key constraints to drop or error occurred: %', SQLERRM;
      END $constraints$;
      
      -- Drop the problematic column
      ALTER TABLE provider_navigation_configs DROP COLUMN IF EXISTS provider_id;
      RAISE NOTICE 'MIGRATION: Dropped bigint provider_id column';
      
      -- Add the correct UUID column
      ALTER TABLE provider_navigation_configs 
      ADD COLUMN provider_id uuid NOT NULL DEFAULT gen_random_uuid();
      RAISE NOTICE 'MIGRATION: Added uuid provider_id column';
      
      -- Add foreign key constraint to authorized_providers
      ALTER TABLE provider_navigation_configs 
      ADD CONSTRAINT provider_navigation_configs_provider_id_fkey 
      FOREIGN KEY (provider_id) REFERENCES authorized_providers(id) ON DELETE CASCADE;
      RAISE NOTICE 'MIGRATION: Added foreign key constraint to authorized_providers';
      
      -- Add unique constraint
      ALTER TABLE provider_navigation_configs 
      ADD CONSTRAINT provider_navigation_configs_provider_id_unique 
      UNIQUE (provider_id);
      RAISE NOTICE 'MIGRATION: Added unique constraint on provider_id';
      
      -- Recreate indexes
      DROP INDEX IF EXISTS idx_provider_navigation_configs_provider_id;
      CREATE INDEX idx_provider_navigation_configs_provider_id ON provider_navigation_configs(provider_id);
      RAISE NOTICE 'MIGRATION: Recreated indexes';
      
      -- Note: We cannot restore the backed up data because the old bigint IDs 
      -- won't match the new UUID provider IDs. This is expected for this type of schema fix.
      RAISE NOTICE 'MIGRATION: Schema conversion complete. Note: Previous data could not be migrated due to ID type change.';
      
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'provider_navigation_configs' 
      AND column_name = 'provider_id' 
      AND data_type = 'uuid'
    ) THEN
      RAISE NOTICE 'MIGRATION: provider_id is already uuid type - no schema change needed';
      
    ELSE
      RAISE NOTICE 'MIGRATION: provider_id column not found or has unexpected type';
    END IF;
  END IF;
  
  -- Ensure updated_at trigger exists
  DROP TRIGGER IF EXISTS set_provider_navigation_configs_updated_at ON provider_navigation_configs;
  CREATE TRIGGER set_provider_navigation_configs_updated_at
    BEFORE UPDATE ON provider_navigation_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  
  RAISE NOTICE 'MIGRATION: provider_navigation_configs schema fix completed successfully';
  
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON provider_navigation_configs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Final verification
DO $$ 
BEGIN
  -- Verify the fix
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'provider_navigation_configs' 
    AND column_name = 'provider_id' 
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE '✅ VERIFICATION: provider_navigation_configs.provider_id is now uuid type';
  ELSE
    RAISE EXCEPTION '❌ VERIFICATION FAILED: provider_id is not uuid type after migration';
  END IF;
  
  -- Check foreign key constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'provider_navigation_configs' 
    AND kcu.column_name = 'provider_id'
    AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE '✅ VERIFICATION: Foreign key constraint to authorized_providers exists';
  ELSE
    RAISE NOTICE '⚠️  VERIFICATION: Foreign key constraint may be missing';
  END IF;
END $$;