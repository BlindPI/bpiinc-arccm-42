
import type { Team, EnhancedTeam } from "@/types/user-management";

export const transformTeamData = (rawData: any): Team => {
  return {
    id: rawData.id,
    name: rawData.name,
    description: rawData.description || null,
    metadata: rawData.metadata || { visibility: 'private' },
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    // Enhanced properties with defaults
    team_type: rawData.team_type || 'operational',
    status: rawData.status || 'active',
    performance_score: rawData.performance_score || 0,
    monthly_targets: rawData.monthly_targets || {},
    current_metrics: rawData.current_metrics || {},
    location_id: rawData.location_id,
    provider_id: rawData.provider_id,
    created_by: rawData.created_by,
    location: rawData.location,
    provider: rawData.provider,
    members: rawData.members
  };
};

export const teamToEnhancedTeam = (team: Team): EnhancedTeam => {
  return {
    ...team,
    description: team.description || undefined,
    team_type: team.team_type || 'operational',
    status: team.status || 'active',
    performance_score: team.performance_score || 0,
    monthly_targets: team.monthly_targets || {},
    current_metrics: team.current_metrics || {}
  };
};

export const enhancedTeamToTeam = (enhancedTeam: EnhancedTeam): Team => {
  return {
    ...enhancedTeam,
    description: enhancedTeam.description || null
  };
};
