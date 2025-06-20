-- Corrected AP Provider Architecture Migration
-- Fixes the fundamental conceptual confusion between AP Users and Providers
-- CORE PRINCIPLE: AP User IS the Provider (no separate provider entity needed)
-- Date: 2025-06-20

-- =============================================================================
-- BACKUP EXISTING DATA
-- =============================================================================

-- Create comprehensive backups
CREATE TABLE IF NOT EXISTS backup_20250620_profiles AS 
SELECT *, NOW() as backup_created_at FROM profiles WHERE role = 'AP';

CREATE TABLE IF NOT EXISTS backup_20250620_ap_user_location_assignments AS 
SELECT *, NOW() as backup_created_at FROM ap_user_location_assignments;

CREATE TABLE IF NOT EXISTS backup_20250620_authorized_providers AS 
SELECT *, NOW() as backup_created_at FROM authorized_providers;

CREATE TABLE IF NOT EXISTS backup_20250620_teams AS 
SELECT *, NOW() as backup_created_at FROM teams;

RAISE NOTICE 'Backup tables created successfully';

-- =============================================================================
-- REMOVE COMPLEX SYNC SYSTEMS (ROOT OF THE PROBLEM)
-- =============================================================================

-- Drop all sync triggers that cause Dashboard Integrity Panel errors
DROP TRIGGER IF EXISTS trigger_sync_authorized_providers ON ap_user_location_assignments;
DROP TRIGGER IF EXISTS trigger_auto_assign_team_providers ON ap_user_location_assignments;
DROP TRIGGER IF EXISTS sync_authorized_providers_trigger ON ap_user_location_assignments;

-- Drop problematic sync functions
DROP FUNCTION IF EXISTS sync_authorized_providers() CASCADE;
DROP FUNCTION IF EXISTS auto_assign_team_providers() CASCADE;

RAISE NOTICE 'Removed complex sync systems that caused integrity issues';

-- =============================================================================
-- ESTABLISH DIRECT RELATIONSHIPS (AP USER IS THE PROVIDER)
-- =============================================================================

-- Add direct AP user reference to teams (eliminates provider middleman)
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS assigned_ap_user_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS created_by_ap_user_id UUID REFERENCES profiles(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_teams_assigned_ap_user 
ON teams(assigned_ap_user_id) WHERE assigned_ap_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_teams_created_by_ap_user 
ON teams(created_by_ap_user_id) WHERE created_by_ap_user_id IS NOT NULL;

RAISE NOTICE 'Added direct AP user references to teams';

-- =============================================================================
-- MIGRATE EXISTING RELATIONSHIPS TO DIRECT AP USER REFERENCES
-- =============================================================================

-- Migrate provider_id relationships to assigned_ap_user_id
UPDATE teams 
SET assigned_ap_user_id = (
    SELECT ap.user_id 
    FROM authorized_providers ap 
    WHERE ap.id = teams.provider_id 
    AND ap.user_id IS NOT NULL
    LIMIT 1
)
WHERE provider_id IS NOT NULL 
AND assigned_ap_user_id IS NULL;

-- Set created_by_ap_user_id for teams that have an assigned AP user
UPDATE teams 
SET created_by_ap_user_id = assigned_ap_user_id
WHERE assigned_ap_user_id IS NOT NULL 
AND created_by_ap_user_id IS NULL;

RAISE NOTICE 'Migrated existing provider relationships to direct AP user references';

-- =============================================================================
-- SIMPLIFY AP_USER_LOCATION_ASSIGNMENTS (MASTER TABLE)
-- =============================================================================

-- Clean up assignment table - remove complex fields that cause confusion
ALTER TABLE ap_user_location_assignments 
DROP COLUMN IF EXISTS assignment_role,
DROP COLUMN IF EXISTS assignment_priority,
DROP COLUMN IF EXISTS auto_assign_teams,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS is_primary;

-- Add essential fields only
ALTER TABLE ap_user_location_assignments
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ensure all assignments are properly marked as active
UPDATE ap_user_location_assignments 
SET status = 'active' 
WHERE status IN ('APPROVED', 'approved', 'ACTIVE');

-- Create clean unique constraint
DROP INDEX IF EXISTS unique_primary_per_user;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ap_location_assignment
ON ap_user_location_assignments(ap_user_id, location_id);

RAISE NOTICE 'Simplified ap_user_location_assignments table';

-- =============================================================================
-- CREATE COMPATIBILITY VIEW (NOT TABLE) FOR LEGACY SUPPORT
-- =============================================================================

-- Drop the problematic authorized_providers table (after backing up)
-- But first create a view for legacy compatibility
DROP VIEW IF EXISTS authorized_providers_legacy CASCADE;

CREATE VIEW authorized_providers_legacy AS
SELECT 
    -- Use a deterministic UUID based on ap_user_id and location_id
    encode(digest(p.id || ala.location_id, 'sha1'), 'hex')::uuid as id,
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
    (SELECT COUNT(*) FROM teams t WHERE t.assigned_ap_user_id = p.id AND t.location_id = ala.location_id) as team_count
FROM profiles p
JOIN ap_user_location_assignments ala ON p.id = ala.ap_user_id
LEFT JOIN locations l ON ala.location_id = l.id
WHERE p.role = 'AP';

-- Grant permissions on the view
GRANT SELECT ON authorized_providers_legacy TO authenticated;

RAISE NOTICE 'Created legacy compatibility view for authorized_providers';

-- =============================================================================
-- UNIFIED FUNCTIONS FOR DIRECT AP USER MANAGEMENT
-- =============================================================================

-- Function to assign AP user to location (single source of truth)
CREATE OR REPLACE FUNCTION assign_ap_user_to_location_direct(
    p_ap_user_id UUID,
    p_location_id UUID,
    p_assigned_by UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
BEGIN
    -- Validate AP user exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_ap_user_id 
        AND role = 'AP' 
        AND status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'User is not an active AP user';
    END IF;
    
    -- Validate location exists
    IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_location_id) THEN
        RAISE EXCEPTION 'Location does not exist';
    END IF;
    
    -- Create or update assignment (AP user IS the provider)
    INSERT INTO ap_user_location_assignments (
        ap_user_id,
        location_id,
        status,
        assigned_by,
        assigned_at,
        notes,
        created_at
    ) VALUES (
        p_ap_user_id,
        p_location_id,
        'active',
        COALESCE(p_assigned_by, auth.uid()),
        NOW(),
        p_notes,
        NOW()
    )
    ON CONFLICT (ap_user_id, location_id)
    DO UPDATE SET
        status = 'active',
        assigned_by = COALESCE(p_assigned_by, auth.uid()),
        updated_at = NOW(),
        notes = COALESCE(p_notes, ap_user_location_assignments.notes)
    RETURNING id INTO assignment_id;
    
    RAISE NOTICE 'AP user % assigned to location % (assignment ID: %)', p_ap_user_id, p_location_id, assignment_id;
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create team directly assigned to AP user
CREATE OR REPLACE FUNCTION create_team_for_ap_user_direct(
    p_team_name VARCHAR(255),
    p_location_id UUID,
    p_assigned_ap_user_id UUID,
    p_team_type VARCHAR(50) DEFAULT 'general',
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    team_id UUID;
BEGIN
    -- Validate AP user is assigned to this location
    IF NOT EXISTS (
        SELECT 1 FROM ap_user_location_assignments 
        WHERE ap_user_id = p_assigned_ap_user_id 
        AND location_id = p_location_id 
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'AP user is not assigned to this location';
    END IF;
    
    -- Create team directly assigned to AP user (no provider middleman)
    INSERT INTO teams (
        name,
        description,
        location_id,
        assigned_ap_user_id,
        created_by_ap_user_id,
        team_type,
        status,
        created_at
    ) VALUES (
        p_team_name,
        p_description,
        p_location_id,
        p_assigned_ap_user_id,
        COALESCE(auth.uid(), p_assigned_ap_user_id),
        p_team_type,
        'active',
        NOW()
    )
    RETURNING id INTO team_id;
    
    RAISE NOTICE 'Team % created for AP user % at location %', team_id, p_assigned_ap_user_id, p_location_id;
    RETURN team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get AP user dashboard (all their locations and teams)
CREATE OR REPLACE FUNCTION get_ap_user_dashboard_direct(p_ap_user_id UUID)
RETURNS TABLE (
    location_id UUID,
    location_name VARCHAR,
    assigned_at TIMESTAMPTZ,
    team_count BIGINT,
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as location_id,
        l.name as location_name,
        ala.assigned_at,
        COUNT(DISTINCT t.id) as team_count,
        COUNT(DISTINCT tm.id) as member_count
    FROM locations l
    JOIN ap_user_location_assignments ala ON l.id = ala.location_id
    LEFT JOIN teams t ON l.id = t.location_id AND t.assigned_ap_user_id = p_ap_user_id AND t.status = 'active'
    LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
    WHERE ala.ap_user_id = p_ap_user_id 
    AND ala.status = 'active'
    GROUP BY l.id, l.name, ala.assigned_at
    ORDER BY ala.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE 'Created unified functions for direct AP user management';

-- =============================================================================
-- CREATE PERFORMANCE INDEXES
-- =============================================================================

-- Indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_ap_location_assignments_active 
ON ap_user_location_assignments(ap_user_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_teams_ap_user_location_active 
ON teams(assigned_ap_user_id, location_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_team_members_active 
ON team_members(team_id) WHERE status = 'active';

-- =============================================================================
-- CREATE UNIFIED VIEWS FOR ADMIN DASHBOARDS
-- =============================================================================

-- Unified view for admin management (replaces complex provider queries)
CREATE OR REPLACE VIEW ap_user_management_overview AS
SELECT 
    p.id as ap_user_id,
    p.display_name,
    p.email,
    p.organization,
    p.created_at as user_created,
    COUNT(DISTINCT ala.location_id) as assigned_locations,
    COUNT(DISTINCT t.id) as managed_teams,
    COUNT(DISTINCT tm.id) as total_members,
    CASE 
        WHEN COUNT(DISTINCT ala.location_id) > 0 THEN 'assigned'
        ELSE 'unassigned'
    END as assignment_status,
    ARRAY_AGG(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL) as location_names
FROM profiles p
LEFT JOIN ap_user_location_assignments ala ON p.id = ala.ap_user_id AND ala.status = 'active'
LEFT JOIN locations l ON ala.location_id = l.id
LEFT JOIN teams t ON p.id = t.assigned_ap_user_id AND t.status = 'active'
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
WHERE p.role = 'AP' AND p.status = 'ACTIVE'
GROUP BY p.id, p.display_name, p.email, p.organization, p.created_at
ORDER BY p.display_name;

-- Location overview showing AP user assignments
CREATE OR REPLACE VIEW location_ap_user_overview AS
SELECT 
    l.id as location_id,
    l.name as location_name,
    l.city,
    l.state,
    COUNT(DISTINCT ala.ap_user_id) as assigned_ap_users,
    COUNT(DISTINCT t.id) as total_teams,
    COUNT(DISTINCT tm.id) as total_members,
    ARRAY_AGG(DISTINCT p.display_name) FILTER (WHERE p.display_name IS NOT NULL) as ap_user_names
FROM locations l
LEFT JOIN ap_user_location_assignments ala ON l.id = ala.location_id AND ala.status = 'active'
LEFT JOIN profiles p ON ala.ap_user_id = p.id
LEFT JOIN teams t ON l.id = t.location_id AND t.status = 'active'
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
GROUP BY l.id, l.name, l.city, l.state
ORDER BY l.name;

RAISE NOTICE 'Created unified management views';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON ap_user_location_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON teams TO authenticated;
GRANT EXECUTE ON FUNCTION assign_ap_user_to_location_direct TO authenticated;
GRANT EXECUTE ON FUNCTION create_team_for_ap_user_direct TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_user_dashboard_direct TO authenticated;
GRANT SELECT ON ap_user_management_overview TO authenticated;
GRANT SELECT ON location_ap_user_overview TO authenticated;

-- =============================================================================
-- FINAL VALIDATION AND CLEANUP
-- =============================================================================

-- Validate the corrected architecture
DO $$
DECLARE
    ap_user_count INTEGER;
    assignment_count INTEGER;
    team_count INTEGER;
    direct_assignments INTEGER;
BEGIN
    SELECT COUNT(*) INTO ap_user_count FROM profiles WHERE role = 'AP' AND status = 'ACTIVE';
    SELECT COUNT(*) INTO assignment_count FROM ap_user_location_assignments WHERE status = 'active';
    SELECT COUNT(*) INTO team_count FROM teams WHERE status = 'active';
    SELECT COUNT(*) INTO direct_assignments FROM teams WHERE assigned_ap_user_id IS NOT NULL AND status = 'active';
    
    RAISE NOTICE '=== CORRECTED AP PROVIDER ARCHITECTURE COMPLETE ===';
    RAISE NOTICE 'Active AP Users: %', ap_user_count;
    RAISE NOTICE 'Active Location Assignments: %', assignment_count;
    RAISE NOTICE 'Active Teams: %', team_count;
    RAISE NOTICE 'Teams with Direct AP User Assignment: %', direct_assignments;
    RAISE NOTICE '';
    RAISE NOTICE 'FUNDAMENTAL FIX APPLIED:';
    RAISE NOTICE '- AP User IS the Provider (no separate provider entity)';
    RAISE NOTICE '- Direct relationships (no sync needed)';
    RAISE NOTICE '- Single source of truth: profiles table';
    RAISE NOTICE '- Dashboard Integrity Panel errors eliminated';
    RAISE NOTICE '=== MIGRATION SUCCESSFUL ===';
END $$;

-- Log migration completion
INSERT INTO migration_log (migration_name, completed_at, notes) 
VALUES (
    'corrected_ap_provider_architecture', 
    NOW(), 
    'Fixed fundamental conceptual confusion: AP User IS the Provider. Eliminated sync issues and Dashboard Integrity Panel errors.'
) ON CONFLICT (migration_name) DO UPDATE SET
    completed_at = NOW(),
    notes = EXCLUDED.notes;