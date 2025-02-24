
-- Create function to handle team creation
create or replace function public.handle_team_creation()
returns trigger as $$
begin
    insert into public.team_members (team_id, user_id, role)
    values (new.id, new.created_by, 'ADMIN');
    return new;
end;
$$ language plpgsql;

-- Create trigger for team creation
create trigger team_creation_add_admin
    after insert on public.teams
    for each row
    execute function public.handle_team_creation();

-- Create function to handle updated_at
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
