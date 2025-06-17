-- Fix AP User Multiple Locations/Teams Support
-- Remove dummy data and implement proper many-to-many relationships

-- =============================================================================
-- STEP 1: Remove Dummy/Test Data
-- =============================================================================

-- Clear out any test/dummy data from authorized_providers
DELETE FROM public.authorized_providers 
WHERE name IN (
    'Assured Response Training Center', 
    'Regional Safety Institute', 
    'Professional Development Corp'
) OR description LIKE '%sample%' OR description LIKE '%test%';

-- Clear provider_team_assignments that reference deleted providers
DELETE FROM public.provider_team_assignments 
WHERE provider_id NOT IN (SELECT id FROM public.authorized_providers);

-- =============================================================================
-- STEP 2: Fix Authorized Providers Table Structure
-- =============================================================================

-- Add missing columns to authorized_providers table
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'authorized_providers'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.authorized_providers
        ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to authorized_providers table';
    END IF;

    -- Add location_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'authorized_providers'
        AND column_name = 'location_id'
    ) THEN
        ALTER TABLE public.authorized_providers
        ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added location_id column to authorized_providers table';
    END IF;

    -- Add assignment_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'authorized_providers'
        AND column_name = 'assignment_type'
    ) THEN
        ALTER TABLE public.authorized_providers
        ADD COLUMN assignment_type VARCHAR(50) DEFAULT 'location_based'
        CHECK (assignment_type IN ('location_based', 'organization_wide', 'project_based'));
        RAISE NOTICE 'Added assignment_type column to authorized_providers table';
    END IF;

    -- Remove any existing unique constraint on user_id only (causing the 400 error)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'authorized_providers'
        AND constraint_name LIKE '%user_id%'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE public.authorized_providers DROP CONSTRAINT IF EXISTS authorized_providers_user_id_key;
        RAISE NOTICE 'Removed unique constraint on user_id to allow multiple locations per AP user';
    END IF;
END;
$$;

-- =============================================================================
-- STEP 3: Create AP User Location Assignments Table
-- =============================================================================

-- This table manages which AP users are assigned to which locations
DROP TABLE IF EXISTS public.ap_user_location_assignments CASCADE;
CREATE TABLE public.ap_user_location_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ap_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    assignment_role VARCHAR(50) DEFAULT 'provider' CHECK (assignment_role IN ('provider', 'supervisor', 'coordinator', 'manager')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ap_user_id, location_id) -- One assignment per AP user per location
);

-- Enable RLS
ALTER TABLE public.ap_user_location_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "admin_full_ap_assignments_access" ON public.ap_user_location_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "ap_users_view_own_assignments" ON public.ap_user_location_assignments
FOR SELECT USING (
    ap_user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'AP')
    )
);

-- =============================================================================
-- STEP 4: Create Functions for AP User Management
-- =============================================================================

-- Function to assign AP user to location
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
    
    -- Create corresponding authorized_provider record
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
        p.id,
        p.display_name,
        p.display_name,
        COALESCE(p.organization, ''),
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
    FROM public.profiles p
    WHERE p.id = p_ap_user_id
    ON CONFLICT (user_id, location_id) DO UPDATE SET
        status = 'APPROVED',
        updated_at = NOW();
    
    RETURN assignment_id;
END;
$$;

-- Function to get AP user assignments with details
CREATE OR REPLACE FUNCTION get_ap_user_assignments(p_ap_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    assignment_id UUID,
    ap_user_id UUID,
    ap_user_name VARCHAR(255),
    ap_user_email VARCHAR(255),
    location_id UUID,
    location_name VARCHAR(255),
    location_city VARCHAR(100),
    location_state VARCHAR(100),
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
        p.display_name as ap_user_name,
        p.email as ap_user_email,
        ala.location_id,
        l.name as location_name,
        l.city as location_city,
        l.state as location_state,
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

-- Function to get available AP users (not yet assigned to a specific location)
CREATE OR REPLACE FUNCTION get_available_ap_users_for_location(p_location_id UUID)
RETURNS TABLE (
    user_id UUID,
    display_name VARCHAR(255),
    email VARCHAR(255),
    organization VARCHAR(255),
    job_title VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.display_name,
        p.email,
        p.organization,
        p.job_title,
        p.phone,
        p.created_at
    FROM public.profiles p
    WHERE p.role = 'AP' 
    AND p.status = 'ACTIVE'
    AND NOT EXISTS (
        SELECT 1 FROM public.ap_user_location_assignments ala
        WHERE ala.ap_user_id = p.id 
        AND ala.location_id = p_location_id 
        AND ala.status = 'active'
    )
    ORDER BY p.display_name;
END;
$$;

-- =============================================================================
-- STEP 5: Update Authorized Providers to Remove Duplicates
-- =============================================================================

-- Add unique constraint on user_id + location_id combination
ALTER TABLE public.authorized_providers 
ADD CONSTRAINT unique_user_location 
UNIQUE (user_id, location_id);

-- =============================================================================
-- STEP 6: Create Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ap_user_location_assignments_ap_user_id ON public.ap_user_location_assignments(ap_user_id);
CREATE INDEX IF NOT EXISTS idx_ap_user_location_assignments_location_id ON public.ap_user_location_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_ap_user_location_assignments_status ON public.ap_user_location_assignments(status);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_user_location ON public.authorized_providers(user_id, location_id);

-- =============================================================================
-- STEP 7: Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.ap_user_location_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION assign_ap_user_to_location TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_user_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_ap_users_for_location TO authenticated;

-- =============================================================================
-- COMPLETION
-- =============================================================================

RAISE NOTICE 'AP User Multiple Locations Support implemented successfully!';
RAISE NOTICE 'Removed: Dummy/test data from authorized_providers';
RAISE NOTICE 'Fixed: Unique constraint issue on user_id';
RAISE NOTICE 'Created: ap_user_location_assignments table for many-to-many relationships';
RAISE NOTICE 'Added: Functions for AP user location management';
RAISE NOTICE 'Ready: For updated service layer implementation';