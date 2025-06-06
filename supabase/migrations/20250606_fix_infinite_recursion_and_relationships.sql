-- Migration: Fix infinite recursion and relationship issues
-- Date: 2025-06-06
-- Purpose: Resolve RLS infinite recursion and fix team-location relationships

-- Step 1: Drop all problematic policies to stop the infinite recursion
DROP POLICY IF EXISTS "Users can view team-scoped profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view accessible teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view accessible locations" ON public.locations;
DROP POLICY IF EXISTS "SA and AD can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Users can view location-scoped compliance issues" ON public.compliance_issues;
DROP POLICY IF EXISTS "Users can create compliance issues for accessible locations" ON public.compliance_issues;
DROP POLICY IF EXISTS "Users can update their own compliance issues" ON public.compliance_issues;
DROP POLICY IF EXISTS "Users can view location-scoped certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can view location-scoped leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can view location-scoped opportunities" ON public.crm_opportunities;

-- Step 2: Drop and recreate functions to avoid recursion
DROP FUNCTION IF EXISTS get_user_accessible_locations(UUID);
DROP FUNCTION IF EXISTS can_access_location(UUID, UUID);

-- Step 3: Drop existing function with CASCADE and create a simple user role lookup function that doesn't cause recursion
DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Direct query without RLS to avoid recursion
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_uuid;
    
    RETURN COALESCE(user_role, 'ST'); -- Default to student if no role found
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create non-recursive location access function
CREATE OR REPLACE FUNCTION get_user_accessible_locations(user_uuid UUID)
RETURNS UUID[] AS $$
DECLARE
    user_role TEXT;
    location_ids UUID[];
BEGIN
    -- Get user role directly without triggering RLS
    user_role := get_user_role(user_uuid);
    
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
    
    -- All other users: only their team locations
    SELECT ARRAY_AGG(DISTINCT t.location_id) INTO location_ids
    FROM public.teams t
    JOIN public.team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = user_uuid AND t.location_id IS NOT NULL;
    
    RETURN COALESCE(location_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create simple policies that don't cause recursion

-- Drop any remaining profile policies that might exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "SA can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view team member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Profiles table - SIMPLIFIED to avoid recursion
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "SA can view all profiles" ON public.profiles
FOR SELECT USING (
    get_user_role(auth.uid()) = 'SA'
);

CREATE POLICY "Users can view team member profiles" ON public.profiles
FOR SELECT USING (
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

-- Drop any remaining policies that might exist
DROP POLICY IF EXISTS "Users can view accessible locations" ON public.locations;
DROP POLICY IF EXISTS "SA and AD can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Users can view accessible teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view location-scoped compliance issues" ON public.compliance_issues;
DROP POLICY IF EXISTS "Users can create compliance issues for accessible locations" ON public.compliance_issues;
DROP POLICY IF EXISTS "Users can update their own compliance issues" ON public.compliance_issues;
DROP POLICY IF EXISTS "Users can view location-scoped certificates" ON public.certificates;

-- Locations table
CREATE POLICY "Users can view accessible locations" ON public.locations
FOR SELECT USING (
    id = ANY(get_user_accessible_locations(auth.uid()))
);

CREATE POLICY "SA and AD can manage locations" ON public.locations
FOR ALL USING (
    get_user_role(auth.uid()) IN ('SA', 'AD')
);

-- Teams table - Fix the relationship issue
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
    get_user_role(auth.uid()) = 'SA'
    OR
    -- Users can see teams in their accessible locations
    (location_id = ANY(get_user_accessible_locations(auth.uid())) OR location_id IS NULL)
);

-- Compliance issues
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
    OR get_user_role(auth.uid()) IN ('SA', 'AD')
);

-- Certificates
CREATE POLICY "Users can view location-scoped certificates" ON public.certificates
FOR SELECT USING (
    location_id = ANY(get_user_accessible_locations(auth.uid()))
    OR location_id IS NULL -- Allow null for backward compatibility
    OR EXISTS (
        -- Users can see certificates from their own requests
        SELECT 1 FROM public.certificate_requests cr
        WHERE cr.id = certificates.certificate_request_id
        AND cr.user_id = auth.uid()
    )
);

-- Step 6: Fix CRM tables if they exist
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

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_locations(UUID) TO authenticated;

-- Step 8: Add comments for documentation
COMMENT ON FUNCTION get_user_role(UUID) IS 'Returns user role without triggering RLS recursion';
COMMENT ON FUNCTION get_user_accessible_locations(UUID) IS 'Returns array of location IDs that a user can access based on their role and team membership';

-- Step 9: Create a simple system_configurations policy if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_configurations') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view system configurations" ON public.system_configurations;
        DROP POLICY IF EXISTS "SA can manage system configurations" ON public.system_configurations;
        
        -- Create simple policies
        CREATE POLICY "Users can view system configurations" ON public.system_configurations
        FOR SELECT USING (true); -- Allow all authenticated users to read configs
        
        CREATE POLICY "SA can manage system configurations" ON public.system_configurations
        FOR ALL USING (
            get_user_role(auth.uid()) = 'SA'
        );
    END IF;
END $$;

-- Step 10: Create notifications policy if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
        
        -- Create simple policies
        CREATE POLICY "Users can view their notifications" ON public.notifications
        FOR SELECT USING (user_id = auth.uid());
        
        CREATE POLICY "Users can update their notifications" ON public.notifications
        FOR UPDATE USING (user_id = auth.uid());
        
        CREATE POLICY "System can insert notifications" ON public.notifications
        FOR INSERT WITH CHECK (true); -- Allow system to create notifications
    END IF;
END $$;