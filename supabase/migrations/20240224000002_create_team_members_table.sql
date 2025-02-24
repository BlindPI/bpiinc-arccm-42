
-- Create team_members table
create table if not exists public.team_members (
    id uuid default gen_random_uuid() primary key,
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text check (role in ('ADMIN', 'MEMBER')) default 'MEMBER'::text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    unique (team_id, user_id)
);

-- Enable RLS for team_members
alter table public.team_members enable row level security;

-- Create team_members policies
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
