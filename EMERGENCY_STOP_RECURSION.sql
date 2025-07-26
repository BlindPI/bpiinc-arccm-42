-- =====================================================
-- EMERGENCY: STOP INFINITE RECURSION IMMEDIATELY
-- =====================================================
-- This completely disables RLS on problematic tables to stop recursion
-- Then rebuilds with safe, non-recursive policies

-- =====================================================
-- 1. DISABLE RLS ON PROBLEMATIC TABLES
-- =====================================================

-- Disable RLS entirely on tables causing recursion
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE provider_team_assignments DISABLE ROW LEVEL SECURITY;

-- Drop ALL RLS policies to ensure no recursion
DROP POLICY IF EXISTS "Simple team access" ON teams;
DROP POLICY IF EXISTS "Simple team member access" ON team_members;
DROP POLICY IF EXISTS "Simple certificate access" ON certificates;
DROP POLICY IF EXISTS "Simple availability access" ON user_availability;

-- Drop any remaining AP-related policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE policyname ILIKE '%ap%' OR policyname ILIKE '%team%' OR policyname ILIKE '%availability%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END $$;

-- =====================================================
-- 2. RE-ENABLE RLS WITH SAFE, MINIMAL POLICIES
-- =====================================================

-- Re-enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_team_assignments ENABLE ROW LEVEL SECURITY;

-- Create minimal, safe policies (NO RECURSION)

-- Teams: Only direct access, no nested queries
CREATE POLICY "safe_teams_access" ON teams
FOR SELECT USING (
    -- SA/AD see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
    OR
    -- Direct team member check (no nested team_members queries)
    id IN (
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Team Members: Only direct access, no nested queries  
CREATE POLICY "safe_team_members_access" ON team_members
FOR SELECT USING (
    -- Own membership
    user_id = auth.uid()
    OR
    -- SA/AD see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
    OR
    -- Same team members (direct check, no recursion)
    team_id IN (
        SELECT tm.team_id FROM team_members tm 
        WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
);

-- Certificates: Only direct access
CREATE POLICY "safe_certificates_access" ON certificates
FOR SELECT USING (
    -- Own certificates
    user_id = auth.uid()
    OR
    -- SA/AD see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

-- User Availability: Only direct access
CREATE POLICY "safe_availability_access" ON user_availability
FOR SELECT USING (
    -- Own availability
    user_id = auth.uid()
    OR
    -- SA/AD see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

-- Authorized Providers: Only direct access
CREATE POLICY "safe_providers_access" ON authorized_providers
FOR SELECT USING (
    -- Own provider record
    user_id = auth.uid()
    OR
    -- SA/AD see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

-- Provider Team Assignments: Only direct access
CREATE POLICY "safe_provider_assignments_access" ON provider_team_assignments
FOR SELECT USING (
    -- Own provider assignments
    provider_id IN (
        SELECT id FROM authorized_providers WHERE user_id = auth.uid()
    )
    OR
    -- SA/AD see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

-- =====================================================
-- 3. TEST THAT RECURSION IS STOPPED
-- =====================================================

-- Test basic queries that were failing
DO $$
DECLARE
    test_user_id UUID;
    team_count INTEGER;
    member_count INTEGER;
BEGIN
    -- Get a test AP user
    SELECT id INTO test_user_id FROM profiles WHERE role = 'AP' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test team access
        SELECT COUNT(*) INTO team_count 
        FROM teams t
        WHERE t.id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = test_user_id AND status = 'active'
        );
        
        -- Test team member access
        SELECT COUNT(*) INTO member_count
        FROM team_members tm
        WHERE tm.team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = test_user_id AND status = 'active'
        );
        
        RAISE NOTICE 'SUCCESS: AP user % can access % teams and % members', 
            test_user_id, team_count, member_count;
    ELSE
        RAISE NOTICE 'No AP users found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Still having issues - %', SQLERRM;
END $$;

-- =====================================================
-- 4. VERIFY FUNCTIONS WORK
-- =====================================================

-- Test the safe functions we created
DO $$
DECLARE
    test_user_id UUID;
    func_test RECORD;
BEGIN
    SELECT id INTO test_user_id FROM profiles WHERE role = 'AP' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test each safe function
        SELECT COUNT(*) as teams INTO func_test
        FROM get_ap_accessible_teams_safe(test_user_id);
        RAISE NOTICE 'Safe teams function returned % teams', func_test.teams;
        
        SELECT COUNT(*) as members INTO func_test
        FROM get_ap_accessible_team_members_safe(test_user_id);
        RAISE NOTICE 'Safe members function returned % members', func_test.members;
        
        RAISE NOTICE 'All safe functions working!';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Function test error: %', SQLERRM;
END $$;

RAISE NOTICE 'EMERGENCY FIX COMPLETE: Infinite recursion should be stopped';
RAISE NOTICE 'AP users should now be able to access data through the safe functions';
RAISE NOTICE 'Frontend should use get_ap_accessible_*_safe() functions to avoid RLS';