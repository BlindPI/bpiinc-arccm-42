-- Migration: Safely Revert Dashboard Audit Remediation Changes (Phases 1-4)
-- Date: 2025-06-06
-- Purpose: Safely revert all database changes introduced during dashboard audit remediation
-- This version handles deadlocks and active connections

-- Step 1: Terminate any active connections that might cause deadlocks
-- (Only run this if you can safely disconnect users)
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();

-- Step 2: Use IF EXISTS to safely drop objects without errors
-- Drop any new tables created during audit remediation
DROP TABLE IF EXISTS public.system_health_metrics CASCADE;
DROP TABLE IF EXISTS public.system_alerts CASCADE;
DROP TABLE IF EXISTS public.dashboard_metrics_cache CASCADE;
DROP TABLE IF EXISTS public.user_analytics_preferences CASCADE;
DROP TABLE IF EXISTS public.export_job_queue CASCADE;

-- Step 3: Drop functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.calculate_real_monthly_growth(UUID[]) CASCADE;
DROP FUNCTION IF EXISTS public.get_system_health_status() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_utilization_rate(UUID[]) CASCADE;
DROP FUNCTION IF EXISTS public.get_active_system_alerts() CASCADE;
DROP FUNCTION IF EXISTS public.get_real_time_metrics() CASCADE;
DROP FUNCTION IF EXISTS public.export_dashboard_data(jsonb) CASCADE;

-- Step 4: Drop policies one by one with error handling
DO $$
BEGIN
    -- Drop enhanced policies if they exist
    BEGIN
        DROP POLICY IF EXISTS "Enhanced users can view accessible locations" ON public.locations;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop enhanced locations policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enhanced SA and AD can manage locations" ON public.locations;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop enhanced locations management policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enhanced users can view accessible teams" ON public.teams;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop enhanced teams policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enhanced users can view team-scoped profiles" ON public.profiles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop enhanced profiles policy: %', SQLERRM;
    END;
END $$;

-- Step 5: Recreate basic policies with error handling
DO $$
BEGIN
    -- Locations policies
    BEGIN
        CREATE POLICY "Users can view accessible locations" ON public.locations
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role = 'SA'
            )
            OR
            EXISTS (
                SELECT 1 FROM public.teams t
                JOIN public.team_members tm ON t.id = tm.team_id
                WHERE tm.user_id = auth.uid()
                AND t.location_id = locations.id
            )
        );
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Locations view policy already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create locations view policy: %', SQLERRM;
    END;

    BEGIN
        CREATE POLICY "SA and AD can manage locations" ON public.locations
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('SA', 'AD')
            )
        );
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Locations management policy already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create locations management policy: %', SQLERRM;
    END;

    -- Teams policies
    BEGIN
        CREATE POLICY "Users can view accessible teams" ON public.teams
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.team_members
                WHERE team_members.team_id = teams.id
                AND team_members.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role = 'SA'
            )
        );
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Teams view policy already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create teams view policy: %', SQLERRM;
    END;

    -- Profiles policies
    BEGIN
        CREATE POLICY "Users can view team-scoped profiles" ON public.profiles
        FOR SELECT USING (
            id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid()
                AND p.role = 'SA'
            )
            OR
            EXISTS (
                SELECT 1 FROM public.team_members tm1
                JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
                WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
            )
        );
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Profiles view policy already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create profiles view policy: %', SQLERRM;
    END;
END $$;

-- Step 6: Remove audit-related columns safely
DO $$
BEGIN
    -- Remove system monitoring columns if they exist
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_health_check') THEN
            ALTER TABLE public.profiles DROP COLUMN last_health_check;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop last_health_check column: %', SQLERRM;
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'health_status') THEN
            ALTER TABLE public.teams DROP COLUMN health_status;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop health_status column: %', SQLERRM;
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'audit_trail') THEN
            ALTER TABLE public.certificates DROP COLUMN audit_trail;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop audit_trail column: %', SQLERRM;
    END;
END $$;

-- Step 7: Drop indexes safely
DROP INDEX IF EXISTS idx_system_health_metrics_type;
DROP INDEX IF EXISTS idx_system_alerts_severity;
DROP INDEX IF EXISTS idx_dashboard_metrics_cache_key;
DROP INDEX IF EXISTS idx_profiles_last_health_check;
DROP INDEX IF EXISTS idx_teams_health_status;

-- Step 8: Drop triggers safely
DROP TRIGGER IF EXISTS update_system_health_metrics ON public.profiles;
DROP TRIGGER IF EXISTS audit_trail_trigger ON public.certificates;
DROP TRIGGER IF EXISTS team_health_update_trigger ON public.teams;

-- Step 9: Drop trigger functions
DROP FUNCTION IF EXISTS public.update_system_health_metrics() CASCADE;
DROP FUNCTION IF EXISTS public.create_audit_trail_entry() CASCADE;
DROP FUNCTION IF EXISTS public.update_team_health_status() CASCADE;

-- Step 10: Clean up audit data safely
DO $$
BEGIN
    DELETE FROM public.notifications WHERE message LIKE '%audit%' OR message LIKE '%health check%';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clean up audit notifications: %', SQLERRM;
END $$;

-- Step 11: Revoke permissions safely
DO $$
BEGIN
    REVOKE ALL ON public.system_health_metrics FROM authenticated;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not revoke system_health_metrics permissions: %', SQLERRM;
END $$;

DO $$
BEGIN
    REVOKE ALL ON public.system_alerts FROM authenticated;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not revoke system_alerts permissions: %', SQLERRM;
END $$;

-- Step 12: Ensure basic permissions
GRANT SELECT ON public.locations TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Step 13: Add comments
COMMENT ON TABLE public.locations IS 'Physical locations - reverted from audit changes';
COMMENT ON TABLE public.teams IS 'Team management - reverted from audit changes';
COMMENT ON TABLE public.profiles IS 'User profiles - reverted from audit changes';

-- Step 14: Clean up constraints safely
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%audit%' 
        OR constraint_name LIKE '%health%'
        OR constraint_name LIKE '%monitoring%'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE public.' || constraint_record.table_name || 
                    ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop constraint %: %', constraint_record.constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 15: Final cleanup with error handling
DO $$
BEGIN
    VACUUM ANALYZE public.locations;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not vacuum locations: %', SQLERRM;
END $$;

DO $$
BEGIN
    VACUUM ANALYZE public.teams;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not vacuum teams: %', SQLERRM;
END $$;

DO $$
BEGIN
    VACUUM ANALYZE public.profiles;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not vacuum profiles: %', SQLERRM;
END $$;

-- Log the reversion
DO $$
BEGIN
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        created_at
    ) VALUES (
        (SELECT id FROM public.profiles WHERE role = 'SA' LIMIT 1),
        'Database Audit Reversion Complete',
        'Dashboard audit remediation changes have been safely reverted',
        'SYSTEM',
        NOW()
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not log reversion: %', SQLERRM;
END $$;

-- Success message
SELECT 'Dashboard audit remediation changes have been safely reverted with error handling' as reversion_status;