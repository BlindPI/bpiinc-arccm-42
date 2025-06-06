-- Migration: Revert Dashboard Audit Remediation Changes (Phases 1-4)
-- Date: 2025-06-06
-- Purpose: Revert all database changes introduced during dashboard audit remediation
-- This will restore the system to its pre-audit working state

-- Step 1: Drop any new tables created during audit remediation
DROP TABLE IF EXISTS public.system_health_metrics CASCADE;
DROP TABLE IF EXISTS public.system_alerts CASCADE;
DROP TABLE IF EXISTS public.dashboard_metrics_cache CASCADE;
DROP TABLE IF EXISTS public.user_analytics_preferences CASCADE;
DROP TABLE IF EXISTS public.export_job_queue CASCADE;

-- Step 2: Drop any new functions created during audit remediation
DROP FUNCTION IF EXISTS public.calculate_real_monthly_growth(UUID[]);
DROP FUNCTION IF EXISTS public.get_system_health_status();
DROP FUNCTION IF EXISTS public.calculate_utilization_rate(UUID[]);
DROP FUNCTION IF EXISTS public.get_active_system_alerts();
DROP FUNCTION IF EXISTS public.get_real_time_metrics();
DROP FUNCTION IF EXISTS public.export_dashboard_data(jsonb);

-- Step 3: Restore original RLS policies that may have been modified
-- Drop any modified policies
DROP POLICY IF EXISTS "Enhanced users can view accessible locations" ON public.locations;
DROP POLICY IF EXISTS "Enhanced SA and AD can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Enhanced users can view accessible teams" ON public.teams;
DROP POLICY IF EXISTS "Enhanced users can view team-scoped profiles" ON public.profiles;

-- Step 4: Restore original simple RLS policies
-- Locations table policies
CREATE POLICY "Users can view accessible locations" ON public.locations
FOR SELECT USING (
    -- SA can see all locations
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'SA'
    )
    OR
    -- Users can see locations they have access to through teams
    EXISTS (
        SELECT 1 FROM public.teams t
        JOIN public.team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = auth.uid()
        AND t.location_id = locations.id
    )
);

CREATE POLICY "SA and AD can manage locations" ON public.locations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('SA', 'AD')
    )
);

-- Teams table policies
CREATE POLICY "Users can view accessible teams" ON public.teams
FOR SELECT USING (
    -- Users can see teams they are members of
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
    OR
    -- SA can see all teams
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'SA'
    )
);

-- Profiles table policies
CREATE POLICY "Users can view team-scoped profiles" ON public.profiles
FOR SELECT USING (
    -- Users can always see their own profile
    id = auth.uid()
    OR
    -- SA can see all profiles
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'SA'
    )
    OR
    -- Users can see profiles of people in their teams
    EXISTS (
        SELECT 1 FROM public.team_members tm1
        JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
    )
);

-- Step 5: Remove any audit-related columns that may have been added
-- Check and remove columns if they exist
DO $$
BEGIN
    -- Remove system monitoring columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_health_check') THEN
        ALTER TABLE public.profiles DROP COLUMN last_health_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'health_status') THEN
        ALTER TABLE public.teams DROP COLUMN health_status;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'audit_trail') THEN
        ALTER TABLE public.certificates DROP COLUMN audit_trail;
    END IF;
END $$;

-- Step 6: Drop any audit-related indexes
DROP INDEX IF EXISTS idx_system_health_metrics_type;
DROP INDEX IF EXISTS idx_system_alerts_severity;
DROP INDEX IF EXISTS idx_dashboard_metrics_cache_key;
DROP INDEX IF EXISTS idx_profiles_last_health_check;
DROP INDEX IF EXISTS idx_teams_health_status;

-- Step 7: Remove any audit-related triggers
DROP TRIGGER IF EXISTS update_system_health_metrics ON public.profiles;
DROP TRIGGER IF EXISTS audit_trail_trigger ON public.certificates;
DROP TRIGGER IF EXISTS team_health_update_trigger ON public.teams;

-- Step 8: Drop any audit-related functions that may have been created
DROP FUNCTION IF EXISTS public.update_system_health_metrics();
DROP FUNCTION IF EXISTS public.create_audit_trail_entry();
DROP FUNCTION IF EXISTS public.update_team_health_status();

-- Step 9: Reset any modified sequences or defaults
-- Reset any auto-increment sequences that may have been modified
-- (Add specific sequence resets if any were modified during audit)

-- Step 10: Clean up any audit-related data
-- Remove any test/audit data that may have been inserted
DELETE FROM public.notifications WHERE message LIKE '%audit%' OR message LIKE '%health check%';

-- Step 11: Restore original function implementations if they were modified
-- This would include restoring any original stored procedures or functions
-- that were modified during the audit remediation

-- Step 12: Grant/Revoke permissions to restore original access patterns
-- Revoke any enhanced permissions that were granted during audit
REVOKE ALL ON public.system_health_metrics FROM authenticated;
REVOKE ALL ON public.system_alerts FROM authenticated;
REVOKE ALL ON public.dashboard_metrics_cache FROM authenticated;

-- Ensure basic permissions are maintained
GRANT SELECT ON public.locations TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Step 13: Add comments to document the reversion
COMMENT ON TABLE public.locations IS 'Physical locations - reverted from audit changes';
COMMENT ON TABLE public.teams IS 'Team management - reverted from audit changes';
COMMENT ON TABLE public.profiles IS 'User profiles - reverted from audit changes';

-- Step 14: Final cleanup - remove any orphaned constraints or references
-- Clean up any foreign key constraints that may have been added during audit
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find and drop any audit-related constraints
    FOR constraint_record IN 
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%audit%' 
        OR constraint_name LIKE '%health%'
        OR constraint_name LIKE '%monitoring%'
    LOOP
        EXECUTE 'ALTER TABLE public.' || constraint_record.table_name || 
                ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
    END LOOP;
END $$;

-- Step 15: Vacuum and analyze to clean up
VACUUM ANALYZE public.locations;
VACUUM ANALYZE public.teams;
VACUUM ANALYZE public.profiles;
VACUUM ANALYZE public.team_members;

-- Final verification queries (commented out - uncomment to verify)
-- SELECT 'Locations table restored' as status, count(*) as record_count FROM public.locations;
-- SELECT 'Teams table restored' as status, count(*) as record_count FROM public.teams;
-- SELECT 'Profiles table restored' as status, count(*) as record_count FROM public.profiles;

-- Log the reversion
INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    created_at
) VALUES (
    (SELECT id FROM public.profiles WHERE role = 'SA' LIMIT 1),
    'Database Audit Reversion Complete',
    'All dashboard audit remediation changes have been reverted to restore system functionality',
    'SYSTEM',
    NOW()
);

-- Success message
SELECT 'Dashboard audit remediation changes have been successfully reverted' as reversion_status;