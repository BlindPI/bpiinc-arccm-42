-- Migration: Resolve Provider UUID vs Integer Conflicts
-- This migration addresses the "invalid input syntax for type uuid" errors
-- by ensuring all provider-related functions and constraints use the correct data types

-- First, let's check and fix any potential UUID constraints or functions

-- Drop any existing functions that might have UUID parameters
DROP FUNCTION IF EXISTS get_provider_location_kpis(UUID);
DROP FUNCTION IF EXISTS get_provider_location_teams(UUID);
DROP FUNCTION IF EXISTS assign_provider_to_team(UUID, UUID, TEXT, TEXT, UUID);

-- Ensure the correct functions exist with INTEGER parameters
CREATE OR REPLACE FUNCTION get_provider_location_kpis(p_provider_id INTEGER)
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
        COALESCE(COUNT(DISTINCT i.id), 0)::INTEGER as total_instructors,
        COALESCE(COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END), 0)::INTEGER as active_instructors,
        COALESCE(COUNT(DISTINCT ts.course_id), 0)::INTEGER as total_courses,
        COALESCE(COUNT(DISTINCT c.id), 0)::INTEGER as certificates_issued,
        COALESCE(ap.compliance_score, 0)::NUMERIC as compliance_score,
        COALESCE(ap.performance_rating, 0)::NUMERIC as performance_rating
    FROM authorized_providers ap
    LEFT JOIN instructors i ON i.provider_id = ap.id
    LEFT JOIN teaching_sessions ts ON ts.instructor_id = i.user_id
    LEFT JOIN certificates c ON c.instructor_name = (
        SELECT display_name FROM profiles WHERE id = i.user_id
    )
    WHERE ap.id = p_provider_id
    GROUP BY ap.id, ap.compliance_score, ap.performance_rating;
END;
$$;

CREATE OR REPLACE FUNCTION get_provider_location_teams(p_provider_id INTEGER)
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
        t.description as team_description,
        COALESCE(l.name, 'No Location') as location_name,
        COALESCE(COUNT(tm.id), 0)::INTEGER as member_count,
        COALESCE(t.performance_score, 0)::NUMERIC as performance_score
    FROM teams t
    LEFT JOIN locations l ON l.id = t.location_id
    LEFT JOIN team_members tm ON tm.team_id = t.id
    LEFT JOIN provider_team_assignments pta ON pta.team_id = t.id
    WHERE pta.provider_id = p_provider_id
    GROUP BY t.id, t.name, t.description, l.name, t.performance_score
    ORDER BY t.name;
END;
$$;

-- Update the assign_provider_to_team function to use correct parameter types
CREATE OR REPLACE FUNCTION assign_provider_to_team(
    p_provider_id INTEGER,
    p_team_id UUID,
    p_assignment_role TEXT,
    p_oversight_level TEXT,
    p_assigned_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment_id UUID;
BEGIN
    -- Validate that the provider exists
    IF NOT EXISTS (SELECT 1 FROM authorized_providers WHERE id = p_provider_id) THEN
        RAISE EXCEPTION 'Provider with ID % does not exist', p_provider_id;
    END IF;
    
    -- Validate that the team exists
    IF NOT EXISTS (SELECT 1 FROM teams WHERE id = p_team_id) THEN
        RAISE EXCEPTION 'Team with ID % does not exist', p_team_id;
    END IF;
    
    -- Validate that the assigning user exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_assigned_by) THEN
        RAISE EXCEPTION 'User with ID % does not exist', p_assigned_by;
    END IF;
    
    -- Insert the assignment
    INSERT INTO provider_team_assignments (
        provider_id,
        team_id,
        assignment_role,
        oversight_level,
        assigned_by,
        assigned_at,
        status
    ) VALUES (
        p_provider_id,
        p_team_id,
        p_assignment_role,
        p_oversight_level,
        p_assigned_by,
        NOW(),
        'active'
    ) RETURNING id INTO assignment_id;
    
    RETURN assignment_id;
END;
$$;

-- Ensure the authorized_providers table has the correct structure
-- (This should already be correct, but let's verify)
DO $$
BEGIN
    -- Check if the id column is the correct type
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'authorized_providers' 
        AND column_name = 'id' 
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'Warning: authorized_providers.id is not an integer type';
    END IF;
END;
$$;

-- Add some helpful comments to clarify the data types
COMMENT ON COLUMN authorized_providers.id IS 'Integer primary key for authorized providers';
COMMENT ON COLUMN provider_team_assignments.provider_id IS 'Foreign key to authorized_providers.id (integer)';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_provider_location_kpis(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_location_teams(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_provider_to_team(INTEGER, UUID, TEXT, TEXT, UUID) TO authenticated;

-- Log the completion
INSERT INTO backend_function_status (
    function_name,
    description,
    is_connected,
    last_checked,
    category
) VALUES 
(
    'provider_uuid_conflict_resolution',
    'Resolved UUID vs Integer conflicts in provider-related functions',
    true,
    NOW(),
    'provider_management'
) ON CONFLICT (function_name) DO UPDATE SET
    is_connected = EXCLUDED.is_connected,
    last_checked = EXCLUDED.last_checked,
    error_message = NULL;