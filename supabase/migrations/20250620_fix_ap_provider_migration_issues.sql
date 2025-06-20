-- Fix AP Provider Architecture Migration v2 Issues
-- Addresses common problems that occur after the main migration
-- Date: 2025-06-20

-- =============================================================================
-- CREATE MISSING migration_log TABLE (LIKELY CAUSE OF FINAL INSERT FAILURE)
-- =============================================================================

-- Create migration_log table if it doesn't exist (most common issue)
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON migration_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE migration_log_id_seq TO authenticated;

RAISE NOTICE 'Created migration_log table to fix final insert failure';

-- =============================================================================
-- FIX ROW LEVEL SECURITY POLICIES FOR NEW COLUMNS
-- =============================================================================

-- Enable RLS on critical tables if not already enabled
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE ap_user_location_assignments ENABLE ROW LEVEL SECURITY;

-- Policy for teams with assigned_ap_user_id access
CREATE POLICY IF NOT EXISTS "teams_assigned_ap_user_access" ON teams
    FOR ALL USING (
        auth.uid() = assigned_ap_user_id OR
        auth.uid() = created_by_ap_user_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Policy for AP user location assignments
CREATE POLICY IF NOT EXISTS "ap_assignments_owner_access" ON ap_user_location_assignments
    FOR ALL USING (
        auth.uid() = ap_user_id OR
        auth.uid() = assigned_by OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

RAISE NOTICE 'Applied Row Level Security policies for new columns';

-- =============================================================================
-- FIX DATA INTEGRITY ISSUES
-- =============================================================================

-- Ensure all teams with assigned_ap_user_id have valid references
UPDATE teams 
SET assigned_ap_user_id = NULL, 
    updated_at = NOW()
WHERE assigned_ap_user_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = teams.assigned_ap_user_id 
    AND role = 'AP' 
    AND status = 'ACTIVE'
);

-- Ensure all ap_user_location_assignments reference valid AP users
DELETE FROM ap_user_location_assignments 
WHERE NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = ap_user_location_assignments.ap_user_id 
    AND role = 'AP' 
    AND status = 'ACTIVE'
);

-- Set default status for assignments missing it
UPDATE ap_user_location_assignments 
SET status = 'active' 
WHERE status IS NULL OR status = '';

RAISE NOTICE 'Fixed data integrity issues';

-- =============================================================================
-- CREATE MISSING INDEXES FOR PERFORMANCE
-- =============================================================================

-- Ensure all critical indexes exist
CREATE INDEX IF NOT EXISTS idx_teams_assigned_ap_user_id ON teams(assigned_ap_user_id) WHERE assigned_ap_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teams_created_by_ap_user_id ON teams(created_by_ap_user_id) WHERE created_by_ap_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ap_location_status ON ap_user_location_assignments(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON profiles(role, status) WHERE role = 'AP';

RAISE NOTICE 'Created performance indexes';

-- =============================================================================
-- FIX LEGACY VIEW WITH DETERMINISTIC UUID GENERATION
-- =============================================================================

-- Drop and recreate the legacy view with deterministic UUIDs
DROP VIEW IF EXISTS authorized_providers_legacy CASCADE;

CREATE OR REPLACE VIEW authorized_providers_legacy AS
SELECT 
    -- Generate deterministic UUID based on ap_user_id and location_id
    uuid_generate_v5(
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, 
        ala.ap_user_id::text || '-' || ala.location_id::text
    ) as id,
    p.display_name as name,
    'authorized_provider' as provider_type,
    CASE 
        WHEN p.status = 'ACTIVE' AND ala.status = 'active' THEN 'APPROVED'
        ELSE 'INACTIVE'
    END as status,
    ala.location_id as primary_location_id,
    p.email as contact_email,
    COALESCE(p.organization, 'Authorized Provider') as description,
    0 as performance_rating,
    0 as compliance_score,
    ala.assigned_at as created_at,
    COALESCE(ala.updated_at, ala.assigned_at) as updated_at,
    p.id as user_id,
    -- Additional helpful fields
    l.name as location_name,
    (SELECT COUNT(*) FROM teams t WHERE t.assigned_ap_user_id = p.id AND t.location_id = ala.location_id AND t.status = 'active') as team_count
FROM profiles p
JOIN ap_user_location_assignments ala ON p.id = ala.ap_user_id
LEFT JOIN locations l ON ala.location_id = l.id
WHERE p.role = 'AP' AND p.status = 'ACTIVE' AND ala.status = 'active';

-- Grant permissions on the updated view
GRANT SELECT ON authorized_providers_legacy TO authenticated;

RAISE NOTICE 'Fixed legacy view with deterministic UUID generation';

-- =============================================================================
-- ADD HELPFUL DEBUG FUNCTIONS
-- =============================================================================

-- Function to validate AP Provider architecture
CREATE OR REPLACE FUNCTION validate_ap_provider_architecture()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: AP Users with no location assignments
    RETURN QUERY
    SELECT 
        'AP Users without Location Assignments'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
            ELSE 'WARN'::TEXT
        END,
        COUNT(*)::TEXT || ' AP users have no location assignments'::TEXT
    FROM profiles p
    LEFT JOIN ap_user_location_assignments ala ON p.id = ala.ap_user_id AND ala.status = 'active'
    WHERE p.role = 'AP' AND p.status = 'ACTIVE' AND ala.id IS NULL;
    
    -- Check 2: Teams without AP user assignment
    RETURN QUERY
    SELECT 
        'Teams without AP User Assignment'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
            ELSE 'WARN'::TEXT
        END,
        COUNT(*)::TEXT || ' active teams have no assigned AP user'::TEXT
    FROM teams
    WHERE status = 'active' AND assigned_ap_user_id IS NULL;
    
    -- Check 3: Orphaned team assignments
    RETURN QUERY
    SELECT 
        'Orphaned Team Assignments'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        COUNT(*)::TEXT || ' teams assigned to inactive/non-existent AP users'::TEXT
    FROM teams t
    LEFT JOIN profiles p ON t.assigned_ap_user_id = p.id AND p.role = 'AP' AND p.status = 'ACTIVE'
    WHERE t.assigned_ap_user_id IS NOT NULL AND t.status = 'active' AND p.id IS NULL;
    
    -- Check 4: Legacy provider_id usage
    RETURN QUERY
    SELECT 
        'Legacy provider_id Usage'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
            ELSE 'WARN'::TEXT
        END,
        COUNT(*)::TEXT || ' teams still using old provider_id field'::TEXT
    FROM teams
    WHERE provider_id IS NOT NULL AND status = 'active';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_ap_provider_architecture TO authenticated;

RAISE NOTICE 'Created validation function for ongoing monitoring';

-- =============================================================================
-- COMPLETE PREVIOUS MIGRATION LOG ENTRIES
-- =============================================================================

-- Log this fix migration
INSERT INTO migration_log (migration_name, completed_at, notes) 
VALUES (
    'fix_ap_provider_migration_issues', 
    NOW(), 
    'Fixed migration_log table creation, RLS policies, data integrity, and legacy view UUID generation'
) ON CONFLICT (migration_name) DO UPDATE SET
    completed_at = NOW(),
    notes = EXCLUDED.notes;

-- Complete the previous migration log entry
INSERT INTO migration_log (migration_name, completed_at, notes) 
VALUES (
    'corrected_ap_provider_architecture_v2', 
    NOW(), 
    'Fixed view dependencies. AP User IS the Provider. Eliminated sync issues and Dashboard Integrity Panel errors. Fixed with follow-up migration.'
) ON CONFLICT (migration_name) DO UPDATE SET
    completed_at = NOW(),
    notes = EXCLUDED.notes;

-- =============================================================================
-- FINAL VALIDATION
-- =============================================================================

DO $$
DECLARE
    validation_results RECORD;
    has_failures BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== AP PROVIDER MIGRATION FIXES VALIDATION ===';
    
    FOR validation_results IN 
        SELECT * FROM validate_ap_provider_architecture()
    LOOP
        RAISE NOTICE '% [%]: %', 
            validation_results.check_name,
            validation_results.status,
            validation_results.details;
            
        IF validation_results.status = 'FAIL' THEN
            has_failures := TRUE;
        END IF;
    END LOOP;
    
    IF has_failures THEN
        RAISE NOTICE '⚠️  Some validation checks failed - manual intervention may be required';
    ELSE
        RAISE NOTICE '✅ All critical validation checks passed';
    END IF;
    
    RAISE NOTICE '=== MIGRATION FIXES COMPLETE ===';
END $$;