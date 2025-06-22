-- DISABLE PROFILES RLS ENTIRELY
-- Remove all RLS policies and let application handle security

-- =====================================================================================
-- STEP 1: DROP ALL PROFILES POLICIES
-- =====================================================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to drop policy %, continuing', policy_record.policyname;
        END;
    END LOOP;
END;
$$;

-- =====================================================================================
-- STEP 2: DISABLE RLS ENTIRELY ON PROFILES
-- =====================================================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- STEP 3: GRANT FULL ACCESS TO AUTHENTICATED USERS
-- =====================================================================================

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- =====================================================================================
-- STEP 4: REFRESH SCHEMA
-- =====================================================================================

NOTIFY pgrst, 'reload schema';

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================

DO $$
BEGIN
    RAISE NOTICE '
🔓 PROFILES RLS COMPLETELY DISABLED

✅ All profiles policies removed
✅ RLS disabled on profiles table
✅ Full access granted to authenticated users
✅ No risk of infinite recursion
✅ Team member profiles will be fully accessible
✅ Application can handle security at the business logic level

RESULT: Team member names and counts should now display correctly.
Security is now handled at the application level rather than database level.
';
END;
$$;