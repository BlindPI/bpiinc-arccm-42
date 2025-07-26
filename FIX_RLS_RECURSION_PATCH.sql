-- =====================================================
-- PATCH: Fix dependency issues before main RLS fix
-- =====================================================

-- Drop dependent views first
DROP VIEW IF EXISTS test_ap_team_access CASCADE;
DROP VIEW IF EXISTS ap_availability_access_summary CASCADE;

-- Now we can proceed with the main fix
-- Run FIX_RLS_INFINITE_RECURSION.sql after this patch

-- We'll recreate the test view at the end using the safe functions