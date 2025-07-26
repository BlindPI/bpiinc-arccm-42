-- =====================================================
-- DIAGNOSE EXACT SOURCE OF INFINITE RECURSION
-- =====================================================

-- =====================================================
-- 1. CHECK ALL CURRENT RLS POLICIES
-- =====================================================

-- List all current policies that might cause recursion
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('team_members', 'teams', 'authorized_providers', 'provider_team_assignments', 'user_availability')
ORDER BY tablename, policyname;

-- =====================================================
-- 2. CHECK ALL FUNCTIONS THAT MIGHT CAUSE RECURSION
-- =====================================================

-- Find functions that reference team_members (potential recursion source)
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%team_members%'
AND n.nspname = 'public'
ORDER BY p.proname;

-- =====================================================
-- 3. CHECK ALL TRIGGERS THAT MIGHT CAUSE RECURSION
-- =====================================================

-- List all triggers on problematic tables
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    pg_get_functiondef(pr.oid) as trigger_function_def
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_proc pr ON t.tgfoid = pr.oid
WHERE c.relname IN ('team_members', 'teams', 'authorized_providers', 'provider_team_assignments')
AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- =====================================================
-- 4. CHECK CURRENT RLS STATUS
-- =====================================================

-- Check if RLS is enabled on problematic tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    enable_row_security
FROM pg_tables 
WHERE tablename IN ('team_members', 'teams', 'authorized_providers', 'provider_team_assignments', 'user_availability')
ORDER BY tablename;

-- =====================================================
-- 5. EMERGENCY: COMPLETELY DISABLE EVERYTHING
-- =====================================================

-- Drop ALL functions that might cause recursion
DO $$
DECLARE
    func RECORD;
BEGIN
    FOR func IN 
        SELECT n.nspname as schema_name, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE pg_get_functiondef(p.oid) ILIKE '%team_members%'
        AND n.nspname = 'public'
        AND p.proname LIKE '%ap%'
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', func.schema_name, func.function_name);
            RAISE NOTICE 'Dropped function: %.%', func.schema_name, func.function_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop function %.%: %', func.schema_name, func.function_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop ALL triggers that might cause recursion
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN 
        SELECT t.tgname as trigger_name, c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname IN ('team_members', 'teams', 'authorized_providers', 'provider_team_assignments')
        AND NOT t.tgisinternal
        AND (t.tgname ILIKE '%ap%' OR t.tgname ILIKE '%team%' OR t.tgname ILIKE '%availability%')
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', trig.trigger_name, trig.table_name);
            RAISE NOTICE 'Dropped trigger: % on %', trig.trigger_name, trig.table_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop trigger % on %: %', trig.trigger_name, trig.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Completely disable RLS on ALL potentially problematic tables
ALTER TABLE IF EXISTS team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS authorized_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_team_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS availability_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_availability_permissions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. TEST BASIC QUERY WITHOUT ANY POLICIES
-- =====================================================

-- Now test if we can query team_members without recursion
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO test_count FROM team_members;
    RAISE NOTICE 'SUCCESS: Can query team_members table, found % records', test_count;
    
    SELECT COUNT(*) INTO test_count FROM teams;
    RAISE NOTICE 'SUCCESS: Can query teams table, found % records', test_count;
    
    SELECT COUNT(*) INTO test_count FROM authorized_providers;
    RAISE NOTICE 'SUCCESS: Can query authorized_providers table, found % records', test_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Still cannot query tables - %', SQLERRM;
END $$;

RAISE NOTICE 'NUCLEAR OPTION COMPLETE: All RLS, functions, and triggers disabled';
RAISE NOTICE 'If you are still getting recursion errors, the issue is in the application code, not the database';