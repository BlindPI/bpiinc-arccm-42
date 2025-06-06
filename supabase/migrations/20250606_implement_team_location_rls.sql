-- Migration: Implement team/location-based Row Level Security
-- Date: 2025-06-06
-- Purpose: Secure data access based on team membership and location

-- Step 1: Drop all existing policies that depend on functions
DROP POLICY IF EXISTS "Users can view accessible locations" ON public.locations;
DROP POLICY IF EXISTS "SA and AD can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Users can view location-scoped compliance issues" ON public.compliance_issues;
DROP POLICY IF EXISTS "Users can create compliance issues for accessible locations" ON public.compliance_issues;
DROP POLICY IF EXISTS "Users can update their own compliance issues" ON public.compliance_issues;
DROP POLICY IF EXISTS "Users can view certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can view location-scoped certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view team-scoped profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view teams they are members of or created" ON public.teams;
DROP POLICY IF EXISTS "Users can view accessible teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view location-scoped leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can view location-scoped opportunities" ON public.crm_opportunities;

-- Step 2: Drop functions
DROP FUNCTION IF EXISTS get_user_accessible_locations(UUID);
DROP FUNCTION IF EXISTS can_access_location(UUID, UUID);

-- Step 3: Create functions
CREATE OR REPLACE FUNCTION get_user_accessible_locations(user_uuid UUID)
RETURNS UUID[] AS $$
DECLARE
    user_role TEXT;
    location_ids UUID[];
BEGIN
    -- Get user role from profiles (bypass RLS for this function)
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_uuid;
    
    -- If no role found, return empty array (user might not have profile yet)
    IF user_role IS NULL THEN
        RETURN ARRAY[]::UUID[];
    END IF;
    
    -- SA (System Admin) can access all locations
    IF user_role = 'SA' THEN
        SELECT ARRAY_AGG(id) INTO location_ids FROM public.locations;
        RETURN COALESCE(location_ids, ARRAY[]::UUID[]);
    END IF;
    
    -- AD (Admin) can access teams they're members of or admin of
    IF user_role = 'AD' THEN
        SELECT ARRAY_AGG(DISTINCT t.location_id) INTO location_ids
        FROM public.teams t
        JOIN public.team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = user_uuid AND t.location_id IS NOT NULL;
        
        RETURN COALESCE(location_ids, ARRAY[]::UUID[]);
    END IF;
    
    -- All other users (AP, team members): only their team locations
    SELECT ARRAY_AGG(DISTINCT t.location_id) INTO location_ids
    FROM public.teams t
    JOIN public.team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = user_uuid AND t.location_id IS NOT NULL;
    
    RETURN COALESCE(location_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_location(user_uuid UUID, target_location_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN target_location_id = ANY(get_user_accessible_locations(user_uuid));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create all RLS policies

-- RLS Policies for locations table
CREATE POLICY "Users can view accessible locations" ON public.locations
FOR SELECT USING (
    id = ANY(get_user_accessible_locations(auth.uid()))
);

CREATE POLICY "SA and AD can manage locations" ON public.locations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('SA', 'AD')
    )
);

-- RLS Policies for compliance_issues
CREATE POLICY "Users can view location-scoped compliance issues" ON public.compliance_issues
FOR SELECT USING (
    location_id = ANY(get_user_accessible_locations(auth.uid()))
    OR user_id = auth.uid() -- Users can always see their own issues
);

CREATE POLICY "Users can create compliance issues for accessible locations" ON public.compliance_issues
FOR INSERT WITH CHECK (
    location_id = ANY(get_user_accessible_locations(auth.uid()))
    OR user_id = auth.uid()
);

CREATE POLICY "Users can update their own compliance issues" ON public.compliance_issues
FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('SA', 'AD')
    )
);

-- RLS policies for certificates
CREATE POLICY "Users can view location-scoped certificates" ON public.certificates
FOR SELECT USING (
    location_id = ANY(get_user_accessible_locations(auth.uid()))
    OR location_id IS NULL -- Allow null for backward compatibility during migration
    OR EXISTS (
        -- Users can see certificates from their own requests
        SELECT 1 FROM public.certificate_requests cr
        WHERE cr.id = certificates.certificate_request_id
        AND cr.user_id = auth.uid()
    )
);

-- RLS policies for profiles (team-scoped)
CREATE POLICY "Users can view team-scoped profiles" ON public.profiles
FOR SELECT USING (
    -- Users can always see their own profile (CRITICAL - must be first)
    id = auth.uid()
    OR
    -- SA can see all profiles
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SA'
    OR
    -- Users can see profiles in their accessible locations
    (location_id = ANY(get_user_accessible_locations(auth.uid())) AND location_id IS NOT NULL)
    OR
    -- Users can see profiles of people in their teams
    EXISTS (
        SELECT 1 FROM public.team_members tm1
        JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
    )
);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- Teams table RLS
CREATE POLICY "Users can view accessible teams" ON public.teams
FOR SELECT USING (
    -- Users can see teams they are members of
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
    OR
    -- SA can see all teams
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'SA'
    )
    OR
    -- Users can see teams in their accessible locations
    (location_id = ANY(get_user_accessible_locations(auth.uid())) OR location_id IS NULL)
);

-- Add RLS policy for CRM tables if they exist
DO $$
BEGIN
    -- Check if crm_leads table exists and add location-based RLS
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crm_leads') THEN
        -- Add location_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_leads' AND column_name = 'location_id') THEN
            ALTER TABLE public.crm_leads ADD COLUMN location_id UUID REFERENCES public.locations(id);
            CREATE INDEX IF NOT EXISTS crm_leads_location_idx ON public.crm_leads(location_id);
        END IF;
        
        -- Create RLS policy for CRM leads
        CREATE POLICY "Users can view location-scoped leads" ON public.crm_leads
        FOR SELECT USING (
            location_id = ANY(get_user_accessible_locations(auth.uid()))
            OR location_id IS NULL -- Allow null during migration
        );
    END IF;
    
    -- Check if crm_opportunities table exists and add location-based RLS
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crm_opportunities') THEN
        -- Add location_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_opportunities' AND column_name = 'location_id') THEN
            ALTER TABLE public.crm_opportunities ADD COLUMN location_id UUID REFERENCES public.locations(id);
            CREATE INDEX IF NOT EXISTS crm_opportunities_location_idx ON public.crm_opportunities(location_id);
        END IF;
        
        -- Create RLS policy for CRM opportunities
        CREATE POLICY "Users can view location-scoped opportunities" ON public.crm_opportunities
        FOR SELECT USING (
            location_id = ANY(get_user_accessible_locations(auth.uid()))
            OR location_id IS NULL -- Allow null during migration
        );
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_accessible_locations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_location(UUID, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_user_accessible_locations(UUID) IS 'Returns array of location IDs that a user can access based on their role and team membership';
COMMENT ON FUNCTION can_access_location(UUID, UUID) IS 'Checks if a user can access a specific location';