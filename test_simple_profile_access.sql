-- ==============================================
-- TEST SIMPLE PROFILE ACCESS
-- ==============================================
-- Test if the exact query from SimpleDashboardService works

-- This is the exact query the SimpleDashboardService should be using:
SELECT 
  'DIRECT_PROFILE_QUERY' as test_name,
  id, 
  display_name, 
  email, 
  phone, 
  job_title, 
  role
FROM profiles 
WHERE id = '9b0c66e5-6536-4655-911e-aa39016d7d89';

-- Test if RLS is blocking this specific query format
SELECT 
  'SIMPLE_PROFILE_TEST' as test_name,
  id,
  display_name
FROM profiles 
WHERE id IN (
  '9b0c66e5-6536-4655-911e-aa39016d7d89',
  '0857e517-2cb3-481c-b9fc-7873567b889c',
  'a13a5475-547f-441b-bf45-824a01452d2e'
);