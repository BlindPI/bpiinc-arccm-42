-- Expand team member roles for enterprise team management
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

-- Add new constraint with expanded enterprise roles
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check CHECK (
  role = ANY (ARRAY[
    'ADMIN'::text,
    'MEMBER'::text, 
    'LEAD'::text,
    'SUPERVISOR'::text,
    'COORDINATOR'::text,
    'SPECIALIST'::text,
    'TRAINEE'::text,
    'OBSERVER'::text,
    'CONSULTANT'::text,
    'admin'::text,
    'member'::text,
    'lead'::text,
    'supervisor'::text,
    'coordinator'::text,
    'specialist'::text,
    'trainee'::text,
    'observer'::text,
    'consultant'::text
  ])
);