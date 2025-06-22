-- Add RLS policy to allow AP users to see teams they are assigned to
-- This fixes the "Unknown Team" issue in AP Dashboard

-- Enable RLS on teams table (if not already enabled)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policy for AP users to see teams they are assigned to
CREATE POLICY "ap_users_can_see_assigned_teams" ON teams
    FOR SELECT
    TO authenticated
    USING (
        -- Allow if user is SA or AD (full access)
        auth.jwt() ->> 'user_role' IN ('SA', 'AD')
        OR
        -- Allow AP users to see teams they are assigned to
        (
            auth.jwt() ->> 'user_role' = 'AP'
            AND id IN (
                SELECT pta.team_id 
                FROM provider_team_assignments pta
                INNER JOIN authorized_providers ap ON ap.id = pta.provider_id
                WHERE ap.user_id = auth.uid()
                AND pta.status = 'active'
            )
        )
    );

-- Verify the policy was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teams' 
        AND policyname = 'ap_users_can_see_assigned_teams'
    ) THEN
        RAISE NOTICE '✅ RLS Policy created successfully: ap_users_can_see_assigned_teams';
    ELSE
        RAISE WARNING '❌ Failed to create RLS policy';
    END IF;
END $$;