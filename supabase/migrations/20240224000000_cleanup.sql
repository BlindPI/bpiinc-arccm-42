
-- Drop existing triggers first
drop trigger if exists team_creation_add_admin on public.teams;
drop trigger if exists handle_teams_updated_at on public.teams;
drop trigger if exists handle_team_members_updated_at on public.team_members;

-- Drop existing functions
drop function if exists public.handle_team_creation();
drop function if exists public.handle_updated_at();

-- Drop existing policies
drop policy if exists "Users can view teams they are members of or created" on public.teams;
drop policy if exists "Team admins can update their teams" on public.teams;
drop policy if exists "Users can create teams" on public.teams;
drop policy if exists "Users can view team members for their teams" on public.team_members;
drop policy if exists "Team admins can manage team members" on public.team_members;

-- Drop indices
drop index if exists public.team_members_team_id_idx;
drop index if exists public.team_members_user_id_idx;

-- Drop tables (in correct order due to foreign key constraints)
drop table if exists public.team_members;
drop table if exists public.teams;

