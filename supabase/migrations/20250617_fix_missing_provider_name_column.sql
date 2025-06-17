-- Fix Missing provider_name Column in authorized_providers Table
-- This migration addresses the schema mismatch causing 400 Bad Request errors

-- =============================================================================
-- STEP 1: Add Missing provider_name Column
-- =============================================================================

DO $$
BEGIN
    -- Check if provider_name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'authorized_providers'
        AND column_name = 'provider_name'
    ) THEN
        -- Add provider_name column
        ALTER TABLE public.authorized_providers
        ADD COLUMN provider_name VARCHAR(255);
        
        RAISE NOTICE 'Added provider_name column to authorized_providers table';
        
        -- Populate existing records with provider_name = name
        UPDATE public.authorized_providers
        SET provider_name = name
        WHERE provider_name IS NULL;
        
        RAISE NOTICE 'Populated provider_name column with existing name values';
    ELSE
        RAISE NOTICE 'provider_name column already exists';
    END IF;
END;
$$;

-- =============================================================================
-- STEP 2: Add Missing provider_url Column (if needed)
-- =============================================================================

DO $$
BEGIN
    -- Check if provider_url column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'authorized_providers'
        AND column_name = 'provider_url'
    ) THEN
        -- Add provider_url column
        ALTER TABLE public.authorized_providers
        ADD COLUMN provider_url VARCHAR(500) DEFAULT '';
        
        RAISE NOTICE 'Added provider_url column to authorized_providers table';
    ELSE
        RAISE NOTICE 'provider_url column already exists';
    END IF;
END;
$$;

-- =============================================================================
-- STEP 3: Fix get_ap_user_assignments Function Return Type
-- =============================================================================

-- Drop and recreate the function with correct return types
DROP FUNCTION IF EXISTS get_ap_user_assignments(UUID);

CREATE OR REPLACE FUNCTION get_ap_user_assignments(p_ap_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    assignment_id UUID,
    ap_user_id UUID,
    ap_user_name VARCHAR(255),  -- Changed from TEXT to VARCHAR(255)
    ap_user_email VARCHAR(255), -- Changed from TEXT to VARCHAR(255)
    location_id UUID,
    location_name VARCHAR(255), -- Changed from TEXT to VARCHAR(255)
    location_city VARCHAR(100), -- Changed from TEXT to VARCHAR(100)
    location_state VARCHAR(100), -- Changed from TEXT to VARCHAR(100)
    assignment_role VARCHAR(50),
    status VARCHAR(20),
    start_date DATE,
    end_date DATE,
    team_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ala.id as assignment_id,
        ala.ap_user_id,
        CAST(p.display_name as VARCHAR(255)) as ap_user_name,
        CAST(p.email as VARCHAR(255)) as ap_user_email,
        ala.location_id,
        CAST(l.name as VARCHAR(255)) as location_name,
        CAST(l.city as VARCHAR(100)) as location_city,
        CAST(l.state as VARCHAR(100)) as location_state,
        ala.assignment_role,
        ala.status,
        ala.start_date,
        ala.end_date,
        COALESCE(team_counts.count, 0) as team_count
    FROM public.ap_user_location_assignments ala
    JOIN public.profiles p ON ala.ap_user_id = p.id
    JOIN public.locations l ON ala.location_id = l.id
    LEFT JOIN (
        SELECT 
            ap.location_id,
            COUNT(DISTINCT pta.team_id) as count
        FROM public.authorized_providers ap
        JOIN public.provider_team_assignments pta ON ap.id = pta.provider_id
        WHERE pta.status = 'active'
        GROUP BY ap.location_id
    ) team_counts ON l.id = team_counts.location_id
    WHERE (p_ap_user_id IS NULL OR ala.ap_user_id = p_ap_user_id)
    ORDER BY ala.created_at DESC;
END;
$$;

-- =============================================================================
-- STEP 4: Update assign_ap_user_to_location Function
-- =============================================================================

-- Ensure the function properly handles the provider_name column
CREATE OR REPLACE FUNCTION assign_ap_user_to_location(
    p_ap_user_id UUID,
    p_location_id UUID,
    p_assignment_role VARCHAR(50) DEFAULT 'provider',
    p_end_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    assignment_id UUID;
    is_ap_user BOOLEAN;
    location_exists BOOLEAN;
    user_profile RECORD;
BEGIN
    -- Verify user has AP role
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = p_ap_user_id AND role = 'AP' AND status = 'ACTIVE'
    ) INTO is_ap_user;
    
    IF NOT is_ap_user THEN
        RAISE EXCEPTION 'User is not an active AP user';
    END IF;
    
    -- Verify location exists
    SELECT EXISTS(
        SELECT 1 FROM public.locations 
        WHERE id = p_location_id
    ) INTO location_exists;
    
    IF NOT location_exists THEN
        RAISE EXCEPTION 'Location not found';
    END IF;
    
    -- Get user profile data
    SELECT display_name, email, organization INTO user_profile
    FROM public.profiles 
    WHERE id = p_ap_user_id;
    
    -- Insert or update assignment
    INSERT INTO public.ap_user_location_assignments (
        ap_user_id,
        location_id,
        assignment_role,
        end_date,
        assigned_by
    ) VALUES (
        p_ap_user_id,
        p_location_id,
        p_assignment_role,
        p_end_date,
        auth.uid()
    )
    ON CONFLICT (ap_user_id, location_id) 
    DO UPDATE SET
        assignment_role = EXCLUDED.assignment_role,
        end_date = EXCLUDED.end_date,
        status = 'active',
        updated_at = NOW()
    RETURNING id INTO assignment_id;
    
    -- Create corresponding authorized_provider record with provider_name
    INSERT INTO public.authorized_providers (
        user_id,
        name,
        provider_name,
        provider_url,
        provider_type,
        location_id,
        assignment_type,
        status,
        performance_rating,
        compliance_score,
        approved_by,
        approval_date,
        created_at,
        updated_at
    )
    SELECT 
        p_ap_user_id,
        user_profile.display_name,
        user_profile.display_name, -- Set provider_name same as name
        COALESCE(user_profile.organization, ''),
        'authorized_provider',
        p_location_id,
        'location_based',
        'APPROVED',
        0,
        0,
        auth.uid(),
        NOW(),
        NOW(),
        NOW()
    ON CONFLICT (user_id, location_id) DO UPDATE SET
        provider_name = user_profile.display_name, -- Ensure provider_name is set
        status = 'APPROVED',
        updated_at = NOW();
    
    RETURN assignment_id;
END;
$$;

-- =============================================================================
-- STEP 5: Grant Permissions
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_ap_user_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION assign_ap_user_to_location TO authenticated;

-- =============================================================================
-- COMPLETION
-- =============================================================================

RAISE NOTICE 'Database schema fixes completed successfully!';
RAISE NOTICE 'Fixed: Missing provider_name column in authorized_providers';
RAISE NOTICE 'Fixed: Function return type mismatches in get_ap_user_assignments';
RAISE NOTICE 'Updated: assign_ap_user_to_location function to handle provider_name';