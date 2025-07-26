-- ==============================================
-- EMERGENCY: RESTORE SA/AD USER ROSTER ACCESS
-- ==============================================
-- CRITICAL: SA/AD users need to see ALL rosters including PENDING ones

-- 1. RESTORE ADMIN RLS POLICIES FOR ROSTERS (WITHOUT RECURSION)
-- Remove any problematic policies first
DROP POLICY IF EXISTS "rpc_admin_roster_access" ON rosters;

-- Create simple admin access policy using auth.jwt() to avoid recursion
CREATE POLICY "emergency_admin_roster_access" ON rosters
  FOR ALL USING (
    -- Use auth.jwt() to get role directly from JWT token (no recursion)
    (auth.jwt() ->> 'user_role') IN ('SA', 'AD')
    OR
    -- Fallback: Check if user exists in profiles with SA/AD role
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('SA', 'AD')
    )
  );

-- 2. ENSURE SA/AD CAN SEE ALL ROSTER STATUSES (INCLUDING PENDING)
CREATE POLICY IF NOT EXISTS "admin_all_roster_statuses" ON rosters
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') IN ('SA', 'AD')
    OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('SA', 'AD')
    )
  );

-- 3. TEST IMMEDIATE SA/AD ACCESS TO ALL ROSTERS
SELECT 
  'EMERGENCY_SA_AD_ROSTER_TEST' as test_name,
  COUNT(*) as total_rosters,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_rosters,
  COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_rosters,
  COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_rosters
FROM rosters;

-- 4. SHOW RECENT ROSTERS BY STATUS FOR SA/AD
SELECT 
  'RECENT_ROSTERS_ALL_STATUS' as test_name,
  id,
  name,
  status,
  created_at,
  created_by,
  location_id
FROM rosters 
ORDER BY created_at DESC 
LIMIT 10;