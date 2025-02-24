
-- Create teams table
create table if not exists public.teams (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    metadata jsonb default '{"visibility": "private"}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    parent_id uuid references public.teams(id)
);

-- Create team_members table for managing team membership
create table if not exists public.team_members (
    id uuid default gen_random_uuid() primary key,
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text check (role in ('ADMIN', 'MEMBER')) default 'MEMBER'::text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    unique (team_id, user_id)
);

-- Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Create policies
create policy "Users can view teams they are members of"
    on public.teams
    for select
    using (
        exists (
            select 1 from public.team_members
            where team_members.team_id = teams.id
            and team_members.user_id = auth.uid()
        )
        or
        teams.metadata->>'visibility' = 'public'
    );

create policy "Team admins can update their teams"
    on public.teams
    for update
    using (
        exists (
            select 1 from public.team_members
            where team_members.team_id = teams.id
            and team_members.user_id = auth.uid()
            and team_members.role = 'ADMIN'
        )
    );

create policy "Users can create teams"
    on public.teams
    for insert
    with check (true);

-- Team members policies
create policy "Users can view team members for their teams"
    on public.team_members
    for select
    using (
        exists (
            select 1 from public.team_members as my_membership
            where my_membership.team_id = team_members.team_id
            and my_membership.user_id = auth.uid()
        )
    );

create policy "Team admins can manage team members"
    on public.team_members
    for all
    using (
        exists (
            select 1 from public.team_members as admin_check
            where admin_check.team_id = team_members.team_id
            and admin_check.user_id = auth.uid()
            and admin_check.role = 'ADMIN'
        )
    );

-- Add indices for better performance
create index team_members_team_id_idx on public.team_members(team_id);
create index team_members_user_id_idx on public.team_members(user_id);

-- Create function to automatically update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_teams_updated_at
    before update on public.teams
    for each row
    execute function public.handle_updated_at();

create trigger handle_team_members_updated_at
    before update on public.team_members
    for each row
    execute function public.handle_updated_at();

