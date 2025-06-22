-- EMERGENCY FIX FOR INFINITE RECURSION
-- Remove the broken recursive policies and restore basic functionality

-- =====================================================================================
-- STEP 1: DROP THE RECURSIVE POLICIES CAUSING INFINITE LOOPS
-- =====================================================================================

-- These policies reference profiles table within profile policies = infinite recursion
DROP POLICY IF EXISTS "users_can_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "ap_can_read_team_member_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;
DROP POLICY IF EXISTS "profiles_ap_team_member_access" ON profiles;

-- =====================================================================================
-- STEP 2: DISABLE RLS ON PROFILES TO RESTORE BASIC FUNCTIONALITY
-- =====================================================================================

-- Temporarily disable RLS to stop the infinite recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- STEP 3: REFRESH SCHEMA
-- =====================================================================================

NOTIFY pgrst, 'reload schema';

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'EMERGENCY FIX APPLIED - INFINITE RECURSION STOPPED';
END;
$$;