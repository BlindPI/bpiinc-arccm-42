-- Create Missing Provider Team Management Tables and Functions
-- This migration creates the missing tables and functions needed for Provider Team Management

-- Create ap_user_location_assignments table (missing from current schema)
CREATE TABLE IF NOT EXISTS public.ap_user_location_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ap_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    assignment_role VARCHAR(50) NOT NULL DEFAULT 'provider',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ap_user_id, location_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ap_user_location_assignments_ap_user_id ON public.ap_user_location_assignments(ap_user_id);
CREATE INDEX IF NOT EXISTS idx_ap_user_location_assignments_location_id ON public.ap_user_location_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_ap_user_location_assignments_status ON public.ap_user_location_assignments(status);

-- Enable RLS
ALTER TABLE public.ap_user_location_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view AP user location assignments" ON public.ap_user_location_assignments
FOR SELECT USING (true);

CREATE POLICY "SA and AD can manage AP user location assignments" ON public.ap_user_location_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Grant permissions
GRANT SELECT ON public.ap_user_location_assignments TO authenticated;

-- Function to get available AP users for a location
CREATE OR REPLACE FUNCTION public.get_available_ap_users_for_location(p_location_id UUID)
RETURNS TABLE (
    user_id UUID,
    display_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    organization VARCHAR(255),
    job_title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.display_name,
        p.email,
        p.phone,
        p.organization,
        p.job_title,
        p.created_at
    FROM public.profiles p
    WHERE p.role = 'AP'
    AND p.status = 'ACTIVE'
    AND NOT EXISTS (
        SELECT 1 FROM public.ap_user_location_assignments aula
        WHERE aula.ap_user_id = p.id
        AND aula.location_id = p_location_id
        AND aula.status = 'active'
    )
    ORDER BY p.display_name;
END;
$$;

-- Function to get AP user assignments with details
CREATE OR REPLACE FUNCTION public.get_ap_user_assignments(p_ap_user_id UUID DEFAULT NULL)
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aula.id as assignment_id,
        aula.ap_user_id,
        p.display_name as ap_user_name,
        p.email as ap_user_email,
        aula.location_id,
        l.name as location_name,
        l.city as location_city,
        l.state as location_state,
        aula.assignment_role,
        aula.status,
        aula.start_date,
        aula.end_date,
        COALESCE(team_counts.team_count, 0) as team_count
    FROM public.ap_user_location_assignments aula
    JOIN public.profiles p ON aula.ap_user_id = p.id
    JOIN public.locations l ON aula.location_id = l.id
    LEFT JOIN (
        SELECT 
            pta.provider_id,
            l2.id as location_id,
            COUNT(DISTINCT pta.team_id) as team_count
        FROM public.provider_team_assignments pta
        JOIN public.teams t ON pta.team_id = t.id
        JOIN public.locations l2 ON t.location_id = l2.id
        JOIN public.authorized_providers ap ON pta.provider_id = ap.id
        WHERE pta.status = 'active'
        GROUP BY pta.provider_id, l2.id
    ) team_counts ON team_counts.location_id = aula.location_id
    WHERE (p_ap_user_id IS NULL OR aula.ap_user_id = p_ap_user_id)
    ORDER BY aula.created_at DESC;
END;
$$;

-- Function to assign AP user to location
CREATE OR REPLACE FUNCTION public.assign_ap_user_to_location(
    p_ap_user_id UUID,
    p_location_id UUID,
    p_assignment_role VARCHAR(50) DEFAULT 'provider',
    p_end_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment_id UUID;
    ap_user_record RECORD;
    provider_id UUID;
BEGIN
    -- Validate AP user exists and has correct role
    SELECT id, display_name, email, organization, role, status
    INTO ap_user_record
    FROM public.profiles
    WHERE id = p_ap_user_id
    AND role = 'AP'
    AND status = 'ACTIVE';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'AP user not found or not active';
    END IF;
    
    -- Validate location exists
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE id = p_location_id) THEN
        RAISE EXCEPTION 'Location not found';
    END IF;
    
    -- Create the assignment record
    INSERT INTO public.ap_user_location_assignments (
        ap_user_id,
        location_id,
        assignment_role,
        end_date,
        status
    ) VALUES (
        p_ap_user_id,
        p_location_id,
        p_assignment_role,
        p_end_date,
        'active'
    )
    ON CONFLICT (ap_user_id, location_id)
    DO UPDATE SET
        assignment_role = EXCLUDED.assignment_role,
        end_date = EXCLUDED.end_date,
        status = 'active',
        updated_at = NOW()
    RETURNING id INTO assignment_id;
    
    -- Create or update the corresponding authorized_provider record
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
        created_at,
        updated_at
    ) VALUES (
        p_ap_user_id,
        ap_user_record.display_name,
        ap_user_record.display_name,
        COALESCE(ap_user_record.organization, ''),
        'authorized_provider',
        p_location_id,
        'location_based',
        'APPROVED',
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, location_id)
    DO UPDATE SET
        name = EXCLUDED.name,
        provider_name = EXCLUDED.provider_name,
        status = 'APPROVED',
        updated_at = NOW()
    RETURNING id INTO provider_id;
    
    RETURN assignment_id;
END;
$$;

-- Function to remove AP user from location
CREATE OR REPLACE FUNCTION public.remove_ap_user_from_location(
    p_ap_user_id UUID,
    p_location_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update assignment status to inactive
    UPDATE public.ap_user_location_assignments
    SET status = 'inactive', updated_at = NOW()
    WHERE ap_user_id = p_ap_user_id
    AND location_id = p_location_id;
    
    -- Update corresponding authorized_provider record
    UPDATE public.authorized_providers
    SET status = 'INACTIVE', updated_at = NOW()
    WHERE user_id = p_ap_user_id
    AND location_id = p_location_id;
    
    RETURN TRUE;
END;
$$;

-- Function to get provider team assignments with enhanced details
CREATE OR REPLACE FUNCTION public.get_provider_team_assignments_detailed(p_provider_id UUID)
RETURNS TABLE (
    assignment_id UUID,
    provider_id UUID,
    provider_name VARCHAR(255),
    team_id UUID,
    team_name VARCHAR(255),
    team_type VARCHAR(50),
    assignment_role VARCHAR(50),
    oversight_level VARCHAR(20),
    assignment_type VARCHAR(30),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    team_status VARCHAR(20),
    location_id UUID,
    location_name VARCHAR(255),
    member_count BIGINT,
    performance_score DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pta.id as assignment_id,
        pta.provider_id,
        ap.name as provider_name,
        pta.team_id,
        t.name as team_name,
        t.team_type,
        pta.assignment_role,
        pta.oversight_level,
        pta.assignment_type,
        pta.start_date,
        pta.end_date,
        pta.status,
        t.status as team_status,
        t.location_id,
        l.name as location_name,
        COALESCE(tm.member_count, 0) as member_count,
        COALESCE(t.performance_score, 0) as performance_score
    FROM public.provider_team_assignments pta
    JOIN public.teams t ON pta.team_id = t.id
    LEFT JOIN public.authorized_providers ap ON pta.provider_id = ap.id
    LEFT JOIN public.locations l ON t.location_id = l.id
    LEFT JOIN (
        SELECT team_id, COUNT(*) as member_count
        FROM public.team_members
        WHERE status = 'active'
        GROUP BY team_id
    ) tm ON t.id = tm.team_id
    WHERE pta.provider_id = p_provider_id
    ORDER BY pta.created_at DESC;
END;
$$;

-- Add sample data if no AP user assignments exist
DO $$
BEGIN
    -- Only add sample data if we have AP users and locations but no assignments
    IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'AP' AND status = 'ACTIVE')
    AND EXISTS (SELECT 1 FROM public.locations)
    AND NOT EXISTS (SELECT 1 FROM public.ap_user_location_assignments) THEN
        
        -- Create sample assignments for first 2 AP users and first 2 locations
        INSERT INTO public.ap_user_location_assignments (ap_user_id, location_id, assignment_role)
        SELECT 
            ap_users.id,
            locations.id,
            'provider'
        FROM (
            SELECT id FROM public.profiles 
            WHERE role = 'AP' AND status = 'ACTIVE' 
            LIMIT 2
        ) ap_users
        CROSS JOIN (
            SELECT id FROM public.locations LIMIT 2
        ) locations;
        
        RAISE NOTICE 'Added sample AP user location assignments';
    END IF;
END;
$$;