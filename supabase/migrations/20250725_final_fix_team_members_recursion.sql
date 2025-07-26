-- FINAL FIX: Completely eliminate team_members recursion
-- The team_members policy still has infinite recursion - need to eliminate ALL joins

-- Drop the problematic team_members policy completely
DROP POLICY IF EXISTS "basic_team_member_visibility" ON team_members;

-- Create the simplest possible policy with NO JOINS to prevent recursion
CREATE POLICY "no_recursion_team_members" ON team_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin sees all (direct profile lookup only)
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'SA')
    OR
    -- Users see their own memberships (no joins)
    user_id = auth.uid()
    OR
    -- AP users see all team members (AP role check only)
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'AP')
  )
);

-- Also fix the teams policy to be simpler and avoid potential recursion
DROP POLICY IF EXISTS "basic_team_visibility" ON teams;

CREATE POLICY "no_recursion_teams" ON teams
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin sees all
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'SA')
    OR
    -- AP users see all teams
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'AP')
    OR
    -- Users see teams they belong to (subquery approach to avoid recursion)
    id = ANY(
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

-- Update locations policy to avoid recursion
DROP POLICY IF EXISTS "basic_location_visibility" ON locations;

CREATE POLICY "no_recursion_locations" ON locations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin sees all
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'SA')
    OR
    -- AP users see all locations  
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'AP')
    OR
    -- Users see locations where they have teams (use ANY to avoid joins)
    id = ANY(
      SELECT t.location_id 
      FROM teams t
      WHERE t.id = ANY(
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  )
);

-- Update certificates policy to avoid recursion  
DROP POLICY IF EXISTS "basic_certificate_visibility" ON certificates;

CREATE POLICY "no_recursion_certificates" ON certificates
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin sees all
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'SA')
    OR
    -- AP users see all certificates
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'AP')
    OR
    -- Users see certificates at their team locations (use ANY to avoid joins)
    location_id = ANY(
      SELECT t.location_id 
      FROM teams t
      WHERE t.id = ANY(
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  )
);

-- Comments for safety
COMMENT ON POLICY "no_recursion_team_members" ON team_members IS 
'No joins policy to prevent infinite recursion - AP users see all, others see own';

COMMENT ON POLICY "no_recursion_teams" ON teams IS 
'No joins policy to prevent infinite recursion - uses ANY() instead of EXISTS()';

COMMENT ON POLICY "no_recursion_locations" ON locations IS 
'No joins policy to prevent infinite recursion - uses ANY() subqueries';

COMMENT ON POLICY "no_recursion_certificates" ON certificates IS 
'No joins policy to prevent infinite recursion - uses ANY() subqueries';