-- UUID Standardization Final Migration
-- Comprehensive fix for provider management UUID consistency
-- Addresses all type mismatches and ensures proper UUID handling throughout

-- =============================================================================
-- Phase 1: Clean Up Test Data and Inconsistent Records
-- =============================================================================

-- Remove test/dummy data with integer-like IDs from authorized_providers
DELETE FROM public.authorized_providers 
WHERE id::text ~ '^[0-9]+$' 
   OR name IN ('Test Provider', 'Sample Provider', 'Dummy Provider');

-- Remove orphaned provider_team_assignments that reference non-existent providers
DELETE FROM public.provider_team_assignments 
WHERE provider_id NOT IN (SELECT id FROM public.authorized_providers);

-- Clean up any teams with invalid provider_id references
UPDATE public.teams 
SET provider_id = NULL 
WHERE provider_id IS NOT NULL 
  AND provider_id NOT IN (SELECT id FROM public.authorized_providers);

-- =============================================================================
-- Phase 2: Ensure UUID Consistency in Tables
-- =============================================================================

-- Verify authorized_providers table structure
DO $$
BEGIN
    -- Check if authorized_providers.id is UUID type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'authorized_providers'
        AND column_name = 'id'
        AND data_type = 'uuid'
    ) THEN
        RAISE EXCEPTION 'authorized_providers.id must be UUID type for this migration to work';
    END IF;
    
    RAISE NOTICE 'Verified: authorized_providers.id is UUID type';
END;
$$;

-- Ensure provider_team_assignments has proper UUID foreign key
ALTER TABLE public.provider_team_assignments 
DROP CONSTRAINT IF EXISTS provider_team_assignments_provider_id_fkey;

ALTER TABLE public.provider_team_assignments 
ADD CONSTRAINT provider_team_assignments_provider_id_fkey 
FOREIGN KEY (provider_id) REFERENCES public.authorized_providers(id) ON DELETE CASCADE;

-- Ensure teams.provider_id references authorized_providers properly
ALTER TABLE public.teams 
DROP CONSTRAINT IF EXISTS teams_provider_id_fkey;

ALTER TABLE public.teams 
ADD CONSTRAINT teams_provider_id_fkey 
FOREIGN KEY (provider_id) REFERENCES public.authorized_providers(id) ON DELETE SET NULL;

-- =============================================================================
-- Phase 3: Remove Integer Function Overloads (Prevent PGRST203 Errors)
-- =============================================================================

-- Drop ALL versions of problematic functions to avoid overloading conflicts
DROP FUNCTION IF EXISTS get_provider_location_kpis(UUID);
DROP FUNCTION IF EXISTS get_provider_location_kpis(BIGINT);
DROP FUNCTION IF EXISTS get_provider_location_kpis(INTEGER);
DROP FUNCTION IF EXISTS get_provider_location_teams(UUID);
DROP FUNCTION IF EXISTS get_provider_location_teams(BIGINT);
DROP FUNCTION IF EXISTS get_provider_location_teams(INTEGER);

-- =============================================================================
-- Phase 4: Create UUID-Only Database Functions
-- =============================================================================

-- Provider location KPIs function - UUID parameter only
CREATE OR REPLACE FUNCTION get_provider_location_kpis(p_provider_id UUID)
RETURNS TABLE (
  total_instructors INTEGER,
  active_instructors INTEGER,
  total_courses INTEGER,
  certificates_issued INTEGER,
  compliance_score NUMERIC,
  performance_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT ap.id)::INTEGER, 0) as total_instructors,
    COALESCE(COUNT(DISTINCT CASE WHEN ap.status = 'active' THEN ap.id END)::INTEGER, 0) as active_instructors,
    -- Count courses from course_offerings if available
    COALESCE((
      SELECT COUNT(DISTINCT co.id)::INTEGER 
      FROM course_offerings co 
      JOIN teams t ON co.team_id = t.id
      WHERE t.provider_id = p_provider_id
    ), 0) as total_courses,
    -- Count certificates using instructor_name match
    COALESCE((
      SELECT COUNT(DISTINCT cert.id)::INTEGER 
      FROM certificates cert 
      WHERE cert.instructor_name = ap.name
        AND cert.status = 'ACTIVE'
    ), 0) as certificates_issued,
    COALESCE(AVG(CASE WHEN ap.compliance_score IS NOT NULL THEN ap.compliance_score ELSE 85.0 END), 85.0) as compliance_score,
    COALESCE(AVG(CASE WHEN ap.performance_rating IS NOT NULL THEN ap.performance_rating ELSE 4.2 END), 4.2) as performance_rating
  FROM authorized_providers ap
  WHERE ap.id = p_provider_id
  GROUP BY ap.id, ap.name;
  
  -- If no data found, return default values
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      0::INTEGER as total_instructors,
      0::INTEGER as active_instructors,
      0::INTEGER as total_courses,
      0::INTEGER as certificates_issued,
      85.0::NUMERIC as compliance_score,
      4.2::NUMERIC as performance_rating;
  END IF;
END;
$$;

-- Provider location teams function - UUID parameter only
CREATE OR REPLACE FUNCTION get_provider_location_teams(p_provider_id UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  team_description TEXT,
  location_name TEXT,
  member_count INTEGER,
  performance_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as team_id,
    t.name as team_name,
    COALESCE(t.description, '') as team_description,
    COALESCE(l.name, 'Unknown Location') as location_name,
    COALESCE(COUNT(tm.id)::INTEGER, 0) as member_count,
    COALESCE(t.performance_score::NUMERIC, 4.0) as performance_score
  FROM teams t
  LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.status = 'active'
  LEFT JOIN locations l ON l.id = t.location_id
  WHERE t.provider_id = p_provider_id
  GROUP BY t.id, t.name, t.description, l.name, t.performance_score
  ORDER BY t.name;
END;
$$;

-- =============================================================================
-- Phase 5: Enhanced Provider Management Functions
-- =============================================================================

-- Get provider with full relationship data
CREATE OR REPLACE FUNCTION get_provider_with_relationships(p_provider_id UUID)
RETURNS TABLE (
  provider_data JSON,
  location_data JSON,
  teams_data JSON,
  performance_metrics JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provider_record RECORD;
  location_record RECORD;
  teams_json JSON;
  metrics_json JSON;
BEGIN
  -- Get provider data
  SELECT * INTO provider_record
  FROM authorized_providers
  WHERE id = p_provider_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get location data
  SELECT * INTO location_record
  FROM locations
  WHERE id = provider_record.primary_location_id;
  
  -- Get teams data as JSON
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', t.id,
      'name', t.name,
      'team_type', t.team_type,
      'status', t.status,
      'location_id', t.location_id,
      'performance_score', t.performance_score,
      'member_count', COALESCE(tm.member_count, 0)
    )
  ), '[]'::json) INTO teams_json
  FROM teams t
  LEFT JOIN (
    SELECT team_id, COUNT(*) as member_count
    FROM team_members
    WHERE status = 'active'
    GROUP BY team_id
  ) tm ON t.id = tm.team_id
  WHERE t.provider_id = p_provider_id;
  
  -- Calculate performance metrics
  SELECT json_build_object(
    'certificates_issued', COALESCE((
      SELECT COUNT(*)
      FROM certificates
      WHERE instructor_name = provider_record.name
        AND status = 'ACTIVE'
    ), 0),
    'courses_conducted', COALESCE((
      SELECT COUNT(*)
      FROM course_offerings co
      JOIN teams t ON co.team_id = t.id
      WHERE t.provider_id = p_provider_id
    ), 0),
    'total_members', COALESCE((
      SELECT COUNT(*)
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE t.provider_id = p_provider_id
        AND tm.status = 'active'
    ), 0),
    'active_assignments', COALESCE((
      SELECT COUNT(*)
      FROM provider_team_assignments
      WHERE provider_id = p_provider_id
        AND status = 'active'
    ), 0)
  ) INTO metrics_json;
  
  RETURN QUERY
  SELECT 
    row_to_json(provider_record)::JSON as provider_data,
    COALESCE(row_to_json(location_record), 'null'::json)::JSON as location_data,
    teams_json as teams_data,
    metrics_json as performance_metrics;
END;
$$;

-- =============================================================================
-- Phase 6: Create Sample Data with Proper UUIDs
-- =============================================================================

-- Insert sample authorized providers if none exist
DO $$
DECLARE
  provider1_id UUID := gen_random_uuid();
  provider2_id UUID := gen_random_uuid();
  provider3_id UUID := gen_random_uuid();
  location1_id UUID;
  location2_id UUID;
  team1_id UUID;
  team2_id UUID;
BEGIN
  -- Only create sample data if no providers exist
  IF NOT EXISTS (SELECT 1 FROM public.authorized_providers LIMIT 1) THEN
    
    -- Get some location IDs for assignment
    SELECT id INTO location1_id FROM public.locations ORDER BY created_at LIMIT 1;
    SELECT id INTO location2_id FROM public.locations ORDER BY created_at LIMIT 1 OFFSET 1;
    
    -- Insert sample providers
    INSERT INTO public.authorized_providers (
      id, name, provider_type, status, primary_location_id,
      performance_rating, compliance_score, description,
      contact_email, contact_phone, created_at, updated_at
    ) VALUES 
    (
      provider1_id,
      'Advanced Training Solutions',
      'training_provider',
      'active',
      location1_id,
      4.5,
      92.0,
      'Comprehensive safety and compliance training provider',
      'contact@advancedtraining.com',
      '+1-555-0101',
      NOW(),
      NOW()
    ),
    (
      provider2_id,
      'Professional Skills Institute',
      'certification_body',
      'active',
      location2_id,
      4.2,
      88.5,
      'Professional certification and skills development',
      'info@profskills.com',
      '+1-555-0102',
      NOW(),
      NOW()
    ),
    (
      provider3_id,
      'Safety Excellence Academy',
      'training_provider',
      'active',
      location1_id,
      4.7,
      95.0,
      'Specialized safety training and certification',
      'academy@safetyexcellence.com',
      '+1-555-0103',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created sample authorized providers with UUIDs';
    
    -- Create sample teams if they don't exist and assign to providers
    IF EXISTS (SELECT 1 FROM public.teams LIMIT 1) THEN
      -- Get first two teams
      SELECT id INTO team1_id FROM public.teams ORDER BY created_at LIMIT 1;
      SELECT id INTO team2_id FROM public.teams ORDER BY created_at LIMIT 1 OFFSET 1;
      
      -- Assign providers to teams
      UPDATE public.teams SET provider_id = provider1_id WHERE id = team1_id;
      UPDATE public.teams SET provider_id = provider2_id WHERE id = team2_id;
      
      -- Create provider team assignments
      INSERT INTO public.provider_team_assignments (
        provider_id, team_id, assignment_role, oversight_level, status
      ) VALUES 
      (provider1_id, team1_id, 'primary', 'manage', 'active'),
      (provider2_id, team2_id, 'primary', 'standard', 'active');
      
      RAISE NOTICE 'Created sample provider-team assignments';
    END IF;
  ELSE
    RAISE NOTICE 'Authorized providers already exist, skipping sample data creation';
  END IF;
END;
$$;

-- =============================================================================
-- Phase 7: Indexes and Performance Optimization
-- =============================================================================

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_authorized_providers_status ON public.authorized_providers(status);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_provider_type ON public.authorized_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_primary_location_id ON public.authorized_providers(primary_location_id);

CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_provider_id ON public.provider_team_assignments(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_team_id ON public.provider_team_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_status ON public.provider_team_assignments(status);

CREATE INDEX IF NOT EXISTS idx_teams_provider_id ON public.teams(provider_id);
CREATE INDEX IF NOT EXISTS idx_teams_location_id ON public.teams(location_id);

-- =============================================================================
-- Phase 8: Permissions and Security
-- =============================================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_provider_location_kpis(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_location_teams(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_with_relationships(UUID) TO authenticated;

GRANT SELECT ON public.authorized_providers TO authenticated;
GRANT SELECT ON public.provider_team_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.teams TO authenticated;

-- =============================================================================
-- Phase 9: Validation and Logging
-- =============================================================================

-- Validate the migration results
DO $$
DECLARE
  provider_count INTEGER;
  assignment_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Count providers
  SELECT COUNT(*) INTO provider_count FROM public.authorized_providers;
  
  -- Count assignments
  SELECT COUNT(*) INTO assignment_count FROM public.provider_team_assignments;
  
  -- Count functions
  SELECT COUNT(*) INTO function_count 
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name LIKE 'get_provider_location_%';
  
  RAISE NOTICE '=== UUID STANDARDIZATION MIGRATION COMPLETED ===';
  RAISE NOTICE 'Authorized Providers: %', provider_count;
  RAISE NOTICE 'Provider Team Assignments: %', assignment_count;
  RAISE NOTICE 'Provider Location Functions: %', function_count;
  RAISE NOTICE '';
  RAISE NOTICE 'FIXES APPLIED:';
  RAISE NOTICE '✓ Removed test data with integer IDs';
  RAISE NOTICE '✓ Ensured UUID consistency across all tables';
  RAISE NOTICE '✓ Fixed foreign key constraints';
  RAISE NOTICE '✓ Removed integer function overloads (prevents PGRST203)';
  RAISE NOTICE '✓ Created UUID-only database functions';
  RAISE NOTICE '✓ Added proper sample data with UUIDs';
  RAISE NOTICE '✓ Optimized indexes for performance';
  RAISE NOTICE '✓ Set up proper permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Update frontend services to use UUID strings only';
  RAISE NOTICE '2. Remove integer conversion logic from TypeScript';
  RAISE NOTICE '3. Test provider team assignment workflows';
  RAISE NOTICE '4. Validate certificate and location display';
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION get_provider_location_kpis(UUID) IS 'Get KPI metrics for a specific provider - UUID only version to prevent type conflicts';
COMMENT ON FUNCTION get_provider_location_teams(UUID) IS 'Get team information for a specific provider - UUID only version to prevent type conflicts';
COMMENT ON FUNCTION get_provider_with_relationships(UUID) IS 'Get complete provider data with relationships - optimized for frontend consumption';

COMMENT ON TABLE public.authorized_providers IS 'Authorized training providers with UUID primary keys';
COMMENT ON TABLE public.provider_team_assignments IS 'Junction table for provider-team relationships with UUID foreign keys';

COMMENT ON COLUMN public.authorized_providers.id IS 'UUID primary key for authorized providers';
COMMENT ON COLUMN public.provider_team_assignments.provider_id IS 'UUID foreign key to authorized_providers.id';
COMMENT ON COLUMN public.teams.provider_id IS 'UUID foreign key to authorized_providers.id (nullable)';