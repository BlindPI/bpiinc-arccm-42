
-- First drop the dependent policies
DROP POLICY IF EXISTS "Users can view accessible teams" ON teams;
DROP POLICY IF EXISTS "Team admins can insert teams" ON teams;
DROP POLICY IF EXISTS "Team admins can update teams" ON teams;
DROP POLICY IF EXISTS "Team admins can delete teams" ON teams;
DROP POLICY IF EXISTS "Users can view members of accessible teams" ON team_members;
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;

-- First, ensure the rls_bypass role exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_bypass') THEN
        CREATE ROLE rls_bypass WITH BYPASSRLS;
    END IF;
END
$$;

-- Grant necessary permissions to rls_bypass role
GRANT USAGE ON SCHEMA public TO rls_bypass;
GRANT ALL ON ALL TABLES IN SCHEMA public TO rls_bypass;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO rls_bypass;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO rls_bypass;

-- Now we can safely drop and recreate the functions
DROP FUNCTION IF EXISTS public.is_accessible_team(uuid);
DROP FUNCTION IF EXISTS public.is_team_admin(uuid);

-- Recreate the functions with proper ownership
CREATE OR REPLACE FUNCTION public.is_accessible_team(team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET role = 'rls_bypass'
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    RETURN EXISTS (
        WITH RECURSIVE team_ancestry(id, parent_id, depth) AS (
            -- Base case: start with the target team
            SELECT t.id, t.parent_id, 1
            FROM teams t
            WHERE t.id = team_id
            
            UNION ALL
            
            -- Recursive case: traverse up the hierarchy
            SELECT t.id, t.parent_id, ta.depth + 1
            FROM teams t
            INNER JOIN team_ancestry ta ON ta.parent_id = t.id
            WHERE ta.depth < 10  -- Prevent infinite recursion
        )
        SELECT 1
        FROM team_ancestry a
        INNER JOIN team_members tm ON tm.team_id = a.id
        WHERE tm.user_id = current_user_id
    );
END;
$$;

-- Create is_team_admin function
CREATE OR REPLACE FUNCTION public.is_team_admin(team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET role = 'rls_bypass'
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    RETURN EXISTS (
        WITH RECURSIVE team_ancestry(id, parent_id, depth) AS (
            -- Base case: start with the target team
            SELECT t.id, t.parent_id, 1
            FROM teams t
            WHERE t.id = team_id
            
            UNION ALL
            
            -- Recursive case: traverse up the hierarchy
            SELECT t.id, t.parent_id, ta.depth + 1
            FROM teams t
            INNER JOIN team_ancestry ta ON ta.parent_id = t.id
            WHERE ta.depth < 10  -- Prevent infinite recursion
        )
        SELECT 1
        FROM team_ancestry a
        INNER JOIN team_members tm ON tm.team_id = a.id
        WHERE tm.user_id = current_user_id
        AND tm.role = 'ADMIN'
    );
END;
$$;

-- Set proper ownership of the functions
ALTER FUNCTION public.is_accessible_team(uuid) OWNER TO rls_bypass;
ALTER FUNCTION public.is_team_admin(uuid) OWNER TO rls_bypass;

-- Recreate the RLS policies for teams and team_members
CREATE POLICY "Users can view accessible teams"
ON teams
FOR SELECT
TO authenticated
USING (is_accessible_team(id));

CREATE POLICY "Team admins can insert teams"
ON teams
FOR INSERT
TO authenticated
WITH CHECK (
    CASE 
        WHEN parent_id IS NULL THEN is_admin(auth.uid())
        ELSE is_team_admin(parent_id)
    END
);

CREATE POLICY "Team admins can update teams"
ON teams
FOR UPDATE
TO authenticated
USING (is_team_admin(id))
WITH CHECK (is_team_admin(id));

CREATE POLICY "Team admins can delete teams"
ON teams
FOR DELETE
TO authenticated
USING (is_team_admin(id));

CREATE POLICY "Users can view members of accessible teams"
ON team_members
FOR SELECT
TO authenticated
USING (is_accessible_team(team_id));

CREATE POLICY "Team admins can manage members"
ON team_members
FOR ALL
TO authenticated
USING (is_team_admin(team_id))
WITH CHECK (is_team_admin(team_id));
