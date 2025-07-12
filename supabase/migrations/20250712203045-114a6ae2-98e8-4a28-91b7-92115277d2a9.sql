-- =====================================================================================
-- FIX TEAM CREATION: Function Return Types & RLS Policies
-- =====================================================================================

-- Fix the create_team_bypass_rls function to return exact column types
CREATE OR REPLACE FUNCTION public.create_team_bypass_rls(
  p_name character varying, 
  p_description text DEFAULT NULL::text, 
  p_team_type character varying DEFAULT 'operational'::character varying, 
  p_location_id uuid DEFAULT NULL::uuid, 
  p_provider_id uuid DEFAULT NULL::uuid, 
  p_created_by uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid, 
  name character varying, 
  description text, 
  team_type character varying, 
  status character varying, 
  performance_score integer, 
  location_id uuid, 
  provider_id uuid, 
  created_by uuid, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  metadata jsonb, 
  monthly_targets jsonb, 
  current_metrics jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert new team and return all columns with exact types
  RETURN QUERY
  INSERT INTO public.teams (
    name, 
    description, 
    team_type, 
    status,
    performance_score,
    location_id, 
    provider_id, 
    created_by,
    metadata,
    monthly_targets,
    current_metrics
  ) VALUES (
    p_name, 
    p_description, 
    p_team_type, 
    'active'::character varying,  -- Explicitly cast to character varying
    85,
    p_location_id, 
    p_provider_id, 
    COALESCE(p_created_by, auth.uid()),
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  )
  RETURNING 
    teams.id,
    teams.name,
    teams.description,
    teams.team_type,
    teams.status,
    teams.performance_score,
    teams.location_id,
    teams.provider_id,
    teams.created_by,
    teams.created_at,
    teams.updated_at,
    teams.metadata,
    teams.monthly_targets,
    teams.current_metrics;
END;
$function$;

-- Remove redundant INSERT policies that might be conflicting
DROP POLICY IF EXISTS "teams_insert_sa_ad" ON public.teams;
DROP POLICY IF EXISTS "SA and AD can insert teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can insert teams" ON public.teams;

-- Keep only the main ALL policy for SA/AD users to avoid conflicts
-- First check if the main policy exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teams' 
    AND policyname = 'sa_ad_full_access'
  ) THEN
    CREATE POLICY "sa_ad_full_access" ON public.teams
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('SA', 'AD')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('SA', 'AD')
        )
      );
  END IF;
END $$;

-- Add a helper function to check user authentication and role
CREATE OR REPLACE FUNCTION public.get_user_role_direct(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
  SELECT role FROM public.profiles WHERE id = p_user_id LIMIT 1;
$function$;

-- Add a function to check if user is team admin
CREATE OR REPLACE FUNCTION public.is_team_admin_direct(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id 
    AND team_id = p_team_id 
    AND role = 'ADMIN'
    AND status = 'active'
  );
$function$;