
-- Create teams table
create table if not exists public.teams (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    metadata jsonb default '{"visibility": "private"}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) not null default auth.uid(),
    parent_id uuid references public.teams(id)
);

-- Enable RLS for teams
alter table public.teams enable row level security;

-- Create teams policies
create policy "Users can view teams they are members of or created"
    on public.teams
    for select
    using (
        auth.uid() = created_by
        or exists (
            select 1 from public.team_members
            where team_members.team_id = teams.id
            and team_members.user_id = auth.uid()
        )
        or metadata->>'visibility' = 'public'
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
