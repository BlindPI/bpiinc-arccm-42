-- =====================================================
-- AP User Availability Visibility Comprehensive Fix
-- =====================================================
-- This migration addresses the debug findings that AP users cannot see team availability
-- due to missing permission records and RLS policy gaps

-- =====================================================
-- 1. POPULATE MISSING AVAILABILITY PERMISSIONS
-- =====================================================

-- Populate availability_permissions for AP users to view their team members
INSERT INTO public.availability_permissions (
    grantor_id, 
    grantee_id, 
    target_user_id, 
    permission_type, 
    team_id, 
    is_active
)
SELECT DISTINCT
    ap_profile.id as grantor_id,     -- AP user grants to themselves
    ap_profile.id as grantee_id,     -- AP user receives permission
    team_member.user_id as target_user_id, -- Team member they can view
    'view'::permission_type as permission_type,
    tm.team_id,
    true as is_active
FROM public.profiles ap_profile
JOIN public.team_members ap_tm ON ap_tm.user_id = ap_profile.id
JOIN public.team_members tm ON tm.team_id = ap_tm.team_id  
JOIN public.profiles team_member ON team_member.id = tm.user_id
WHERE ap_profile.role = 'AP'
  AND ap_tm.status = 'active'
  AND tm.status = 'active'
  AND team_member.role IN ('IC', 'IP', 'IT', 'IN')
  AND ap_profile.id != team_member.id  -- Don't grant permission to view own availability
ON CONFLICT DO NOTHING;  -- Ignore if already exists

-- Also populate team_availability_permissions for AP users
INSERT INTO public.team_availability_permissions (
    team_id,
    manager_id,
    permission_level,
    granted_by
)
SELECT DISTINCT
    tm.team_id,
    ap_profile.id as manager_id,
    'view' as permission_level,
    ap_profile.id as granted_by
FROM public.profiles ap_profile
JOIN public.team_members tm ON tm.user_id = ap_profile.id
WHERE ap_profile.role = 'AP'
  AND tm.status = 'active'
ON CONFLICT (team_id, manager_id) DO UPDATE SET
    permission_level = EXCLUDED.permission_level,
    updated_at = now();

-- =====================================================
-- 2. UPDATE RLS POLICIES TO CHECK BOTH PERMISSION TABLES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "AP users can view team availability" ON public.user_availability;
DROP POLICY IF EXISTS "AP users can edit authorized availability" ON public.user_availability;

-- Create comprehensive RLS policy for viewing availability
CREATE POLICY "Role-based availability viewing access" ON public.user_availability
FOR SELECT USING (
    -- Users can always view their own availability
    user_id = auth.uid()
    OR
    -- SA/AD users can view all availability
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
    )
    OR
    -- Check availability_permissions table
    EXISTS (
        SELECT 1 FROM public.availability_permissions ap
        WHERE ap.grantee_id = auth.uid()
        AND ap.permission_type IN ('view', 'edit', 'manage')
        AND ap.is_active = true
        AND (ap.target_user_id IS NULL OR ap.target_user_id = user_availability.user_id)
        AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
    OR
    -- Check team_availability_permissions table for AP users
    EXISTS (
        SELECT 1 FROM public.team_availability_permissions tap
        JOIN public.team_members tm ON tm.team_id = tap.team_id
        WHERE tap.manager_id = auth.uid()
        AND tm.user_id = user_availability.user_id
        AND tm.status = 'active'
        AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
    )
    OR
    -- Direct team membership check for AP users (fallback)
    EXISTS (
        SELECT 1 FROM public.profiles ap_profile
        JOIN public.team_members ap_tm ON ap_tm.user_id = ap_profile.id
        JOIN public.team_members target_tm ON target_tm.team_id = ap_tm.team_id
        WHERE ap_profile.id = auth.uid()
        AND ap_profile.role = 'AP'
        AND target_tm.user_id = user_availability.user_id
        AND ap_tm.status = 'active'
        AND target_tm.status = 'active'
    )
);

-- Create policy for editing availability
CREATE POLICY "Role-based availability editing access" ON public.user_availability
FOR UPDATE USING (
    -- Users can edit their own availability
    user_id = auth.uid()
    OR
    -- SA/AD users can edit all availability
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
    )
    OR
    -- Check availability_permissions for edit/manage permissions
    EXISTS (
        SELECT 1 FROM public.availability_permissions ap
        WHERE ap.grantee_id = auth.uid()
        AND ap.permission_type IN ('edit', 'manage')
        AND ap.is_active = true
        AND (ap.target_user_id IS NULL OR ap.target_user_id = user_availability.user_id)
        AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
    OR
    -- Check team_availability_permissions for edit/full permissions
    EXISTS (
        SELECT 1 FROM public.team_availability_permissions tap
        JOIN public.team_members tm ON tm.team_id = tap.team_id
        WHERE tap.manager_id = auth.uid()
        AND tm.user_id = user_availability.user_id
        AND tm.status = 'active'
        AND tap.permission_level IN ('edit', 'full')
        AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
    )
);

-- =====================================================
-- 3. CREATE AUTOMATIC PERMISSION GRANTING TRIGGERS
-- =====================================================

-- Function to grant availability permissions when AP users join teams
CREATE OR REPLACE FUNCTION grant_ap_team_availability_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when AP users are added to teams
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.user_id AND role = 'AP'
    ) THEN
        -- Grant team_availability_permissions
        INSERT INTO public.team_availability_permissions (
            team_id, manager_id, permission_level, granted_by
        ) VALUES (
            NEW.team_id, NEW.user_id, 'view', NEW.user_id
        ) ON CONFLICT (team_id, manager_id) DO UPDATE SET
            permission_level = EXCLUDED.permission_level,
            updated_at = now();

        -- Grant availability_permissions for all team members
        INSERT INTO public.availability_permissions (
            grantor_id, grantee_id, target_user_id, permission_type, team_id, is_active
        )
        SELECT 
            NEW.user_id as grantor_id,
            NEW.user_id as grantee_id,
            tm.user_id as target_user_id,
            'view'::permission_type as permission_type,
            NEW.team_id,
            true as is_active
        FROM public.team_members tm
        JOIN public.profiles p ON p.id = tm.user_id
        WHERE tm.team_id = NEW.team_id 
        AND tm.status = 'active'
        AND tm.user_id != NEW.user_id
        AND p.role IN ('IC', 'IP', 'IT', 'IN')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Grant permissions to existing AP users when new team members are added
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.user_id AND role IN ('IC', 'IP', 'IT', 'IN')
    ) THEN
        INSERT INTO public.availability_permissions (
            grantor_id, grantee_id, target_user_id, permission_type, team_id, is_active
        )
        SELECT 
            tm.user_id as grantor_id,
            tm.user_id as grantee_id,
            NEW.user_id as target_user_id,
            'view'::permission_type as permission_type,
            NEW.team_id,
            true as is_active
        FROM public.team_members tm
        JOIN public.profiles p ON p.id = tm.user_id
        WHERE tm.team_id = NEW.team_id 
        AND tm.status = 'active'
        AND tm.user_id != NEW.user_id
        AND p.role = 'AP'
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic permission grants
DROP TRIGGER IF EXISTS trigger_grant_ap_availability_permissions ON public.team_members;
CREATE TRIGGER trigger_grant_ap_availability_permissions
    AFTER INSERT ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION grant_ap_team_availability_permissions();

-- Function to revoke permissions when team members are removed
CREATE OR REPLACE FUNCTION revoke_ap_team_availability_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove from availability_permissions
    DELETE FROM public.availability_permissions 
    WHERE team_id = OLD.team_id 
    AND (grantee_id = OLD.user_id OR target_user_id = OLD.user_id);

    -- Remove from team_availability_permissions if it's an AP user
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = OLD.user_id AND role = 'AP'
    ) THEN
        DELETE FROM public.team_availability_permissions 
        WHERE team_id = OLD.team_id AND manager_id = OLD.user_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic permission revocation
DROP TRIGGER IF EXISTS trigger_revoke_ap_availability_permissions ON public.team_members;
CREATE TRIGGER trigger_revoke_ap_availability_permissions
    BEFORE DELETE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION revoke_ap_team_availability_permissions();

-- =====================================================
-- 4. CREATE HELPER FUNCTIONS FOR THE FRONTEND
-- =====================================================

-- Function to get team members that an AP user can view availability for
CREATE OR REPLACE FUNCTION get_ap_team_availability_access(ap_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
    user_id uuid,
    display_name text,
    email text,
    role text,
    team_id uuid,
    team_name text,
    permission_level text
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id as user_id,
        p.display_name,
        p.email,
        p.role,
        t.id as team_id,
        t.name as team_name,
        COALESCE(tap.permission_level, 'view') as permission_level
    FROM public.profiles p
    JOIN public.team_members tm ON tm.user_id = p.id
    JOIN public.teams t ON t.id = tm.team_id
    LEFT JOIN public.team_availability_permissions tap ON tap.team_id = t.id AND tap.manager_id = ap_user_id
    WHERE tm.status = 'active'
    AND (
        -- Direct team permission exists
        tap.manager_id IS NOT NULL
        OR
        -- AP user is in the same team
        EXISTS (
            SELECT 1 FROM public.team_members ap_tm
            JOIN public.profiles ap_profile ON ap_profile.id = ap_tm.user_id
            WHERE ap_tm.user_id = ap_user_id
            AND ap_tm.team_id = tm.team_id
            AND ap_tm.status = 'active'
            AND ap_profile.role = 'AP'
        )
        OR
        -- Available through availability_permissions
        EXISTS (
            SELECT 1 FROM public.availability_permissions ap
            WHERE ap.grantee_id = ap_user_id
            AND ap.target_user_id = p.id
            AND ap.is_active = true
        )
    )
    ORDER BY t.name, p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user can access another user's availability
CREATE OR REPLACE FUNCTION can_access_user_availability(
    target_user_id uuid,
    requesting_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean AS $$
BEGIN
    -- SA/AD can access all
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = requesting_user_id AND role IN ('SA', 'AD')
    ) THEN
        RETURN true;
    END IF;
    
    -- Users can access their own
    IF target_user_id = requesting_user_id THEN
        RETURN true;
    END IF;
    
    -- Check availability_permissions
    IF EXISTS (
        SELECT 1 FROM public.availability_permissions ap
        WHERE ap.grantee_id = requesting_user_id
        AND ap.target_user_id = target_user_id
        AND ap.is_active = true
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
    ) THEN
        RETURN true;
    END IF;
    
    -- Check team_availability_permissions
    IF EXISTS (
        SELECT 1 FROM public.team_availability_permissions tap
        JOIN public.team_members tm ON tm.team_id = tap.team_id
        WHERE tap.manager_id = requesting_user_id
        AND tm.user_id = target_user_id
        AND tm.status = 'active'
        AND (tap.expires_at IS NULL OR tap.expires_at > now())
    ) THEN
        RETURN true;
    END IF;
    
    -- Check direct team membership for AP users
    IF EXISTS (
        SELECT 1 FROM public.profiles ap_profile
        JOIN public.team_members ap_tm ON ap_tm.user_id = ap_profile.id
        JOIN public.team_members target_tm ON target_tm.team_id = ap_tm.team_id
        WHERE ap_profile.id = requesting_user_id
        AND ap_profile.role = 'AP'
        AND target_tm.user_id = target_user_id
        AND ap_tm.status = 'active'
        AND target_tm.status = 'active'
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_ap_team_availability_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_user_availability(uuid, uuid) TO authenticated;

-- =====================================================
-- 5. VERIFICATION AND SUMMARY
-- =====================================================

-- Create a view to verify the fix is working
CREATE OR REPLACE VIEW ap_availability_access_summary AS
SELECT 
    ap_user.display_name as ap_user,
    target_user.display_name as target_user,
    target_user.role as target_role,
    t.name as team_name,
    CASE 
        WHEN tap.permission_level IS NOT NULL THEN tap.permission_level
        WHEN aper.permission_type IS NOT NULL THEN aper.permission_type::text
        ELSE 'direct_team_access'
    END as permission_source,
    CASE
        WHEN tap.manager_id IS NOT NULL THEN 'team_availability_permissions'
        WHEN aper.grantee_id IS NOT NULL THEN 'availability_permissions'
        ELSE 'direct_team_membership'
    END as permission_table
FROM public.profiles ap_user
JOIN public.team_members ap_tm ON ap_tm.user_id = ap_user.id
JOIN public.team_members target_tm ON target_tm.team_id = ap_tm.team_id
JOIN public.profiles target_user ON target_user.id = target_tm.user_id
JOIN public.teams t ON t.id = ap_tm.team_id
LEFT JOIN public.team_availability_permissions tap ON tap.team_id = t.id AND tap.manager_id = ap_user.id
LEFT JOIN public.availability_permissions aper ON aper.grantee_id = ap_user.id AND aper.target_user_id = target_user.id
WHERE ap_user.role = 'AP'
AND ap_tm.status = 'active'
AND target_tm.status = 'active'
AND target_user.role IN ('IC', 'IP', 'IT', 'IN')
AND ap_user.id != target_user.id
ORDER BY ap_user.display_name, t.name, target_user.display_name;

COMMENT ON VIEW ap_availability_access_summary IS 'Shows which AP users have access to which team members availability data and through which permission system';

-- Final verification
DO $$
DECLARE
    ap_permission_count integer;
    team_permission_count integer;
    total_ap_users integer;
BEGIN
    SELECT COUNT(*) INTO ap_permission_count 
    FROM public.availability_permissions 
    WHERE grantee_id IN (SELECT id FROM public.profiles WHERE role = 'AP');
    
    SELECT COUNT(*) INTO team_permission_count 
    FROM public.team_availability_permissions tap
    JOIN public.profiles p ON p.id = tap.manager_id
    WHERE p.role = 'AP';
    
    SELECT COUNT(*) INTO total_ap_users
    FROM public.profiles 
    WHERE role = 'AP';
    
    RAISE NOTICE 'AP Availability Fix Complete:';
    RAISE NOTICE '- AP users: %', total_ap_users;
    RAISE NOTICE '- availability_permissions records: %', ap_permission_count;
    RAISE NOTICE '- team_availability_permissions records: %', team_permission_count;
    RAISE NOTICE 'Check ap_availability_access_summary view for detailed access mapping';
END $$;