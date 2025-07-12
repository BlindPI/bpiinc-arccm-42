
import type { EnhancedTeam } from '@/types/team-management';
import type { SimpleTeam } from '@/types/simplified-team-management';

export function enhancedTeamToSimpleTeam(enhancedTeam: EnhancedTeam): SimpleTeam {
  return {
    id: enhancedTeam.id,
    name: enhancedTeam.name,
    description: enhancedTeam.description,
    team_type: enhancedTeam.team_type,
    status: enhancedTeam.status,
    performance_score: enhancedTeam.performance_score,
    location: enhancedTeam.location,
    provider_id: enhancedTeam.provider_id,
    member_count: enhancedTeam.members?.length || 0,
    created_at: enhancedTeam.created_at,
    updated_at: enhancedTeam.updated_at
  };
}

export function enhancedTeamsToSimpleTeams(enhancedTeams: EnhancedTeam[]): SimpleTeam[] {
  return enhancedTeams.map(enhancedTeamToSimpleTeam);
}
