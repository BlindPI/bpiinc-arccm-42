-- Fix the circular dependency in the AP users certificate requests policy
-- The WITH CHECK clause references certificate_requests.user_id which causes circular dependency during INSERT

-- Drop the problematic policy
DROP POLICY IF EXISTS "ap_users_can_create_team_certificate_requests" ON public.certificate_requests;

-- Recreate with a fixed WITH CHECK clause that doesn't reference the table being inserted into
-- Use auth.uid() = user_id OR check AP permissions separately
CREATE POLICY "ap_users_can_create_team_certificate_requests" ON public.certificate_requests
    FOR INSERT 
    WITH CHECK (
        -- Users can create their own requests
        user_id = auth.uid() 
        OR 
        -- AP users can create requests for team members (validate without circular reference)
        (
            EXISTS (
                SELECT 1 FROM profiles p 
                WHERE p.id = auth.uid() AND p.role = 'AP'
            )
            AND
            EXISTS (
                SELECT 1 
                FROM ap_user_location_assignments apla
                JOIN teams t ON t.location_id = apla.location_id
                JOIN team_members tm ON tm.team_id = t.id
                WHERE apla.ap_user_id = auth.uid() 
                AND tm.user_id = user_id  -- Use the NEW.user_id being inserted
                AND apla.status = 'active'
                AND tm.status = 'active'
            )
        )
    );