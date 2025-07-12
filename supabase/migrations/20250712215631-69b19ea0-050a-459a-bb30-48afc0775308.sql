-- Fix the create_team_bypass_rls function with correct return types matching actual table schema
DROP FUNCTION IF EXISTS public.create_team_bypass_rls(character varying, text, character varying, uuid, uuid, uuid);

-- Create the function with exact types matching the actual teams table schema
CREATE OR REPLACE FUNCTION public.create_team_bypass_rls(
  p_name text, 
  p_description text DEFAULT NULL::text, 
  p_team_type character varying DEFAULT 'operational'::character varying, 
  p_location_id uuid DEFAULT NULL::uuid, 
  p_provider_id uuid DEFAULT NULL::uuid, 
  p_created_by uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid, 
  name text, 
  description text, 
  team_type character varying, 
  status character varying, 
  performance_score numeric, 
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
    'active'::character varying,
    85.0,
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