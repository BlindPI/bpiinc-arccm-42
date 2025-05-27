
import type { Team, EnhancedTeam, SafeJson, parseJsonToRecord } from "@/types/user-management";

// Helper function to safely parse Json to Record<string, any>
function safeParseJson(value: any): SafeJson {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

// Helper function to ensure all required properties exist with defaults
function ensureRequiredProperties(data: any): Team {
  return {
    id: data.id,
    name: data.name || '',
    description: data.description || null,
    metadata: safeParseJson(data.metadata) || { visibility: 'private' },
    created_at: data.created_at || '',
    updated_at: data.updated_at || '',
    team_type: data.team_type || 'operational',
    status: data.status && ['active', 'inactive', 'suspended'].includes(data.status) 
      ? data.status as 'active' | 'inactive' | 'suspended'
      : 'active',
    performance_score: typeof data.performance_score === 'number' ? data.performance_score : 0,
    monthly_targets: safeParseJson(data.monthly_targets) || {},
    current_metrics: safeParseJson(data.current_metrics) || {},
    location_id: data.location_id,
    provider_id: data.provider_id,
    created_by: data.created_by,
    location: data.location,
    provider: data.provider,
    members: data.members
  };
}

export const transformTeamData = (rawData: any): Team => {
  return ensureRequiredProperties(rawData);
};

export const teamToEnhancedTeam = (team: any): EnhancedTeam => {
  // Ensure the team has all required properties
  return ensureRequiredProperties(team);
};

export const enhancedTeamToTeam = (enhancedTeam: EnhancedTeam): Team => {
  // Since EnhancedTeam extends Team, this is a direct conversion
  return enhancedTeam;
};

// Safe conversion for database responses
export const safeTeamConversion = (dbResponse: any): Team => {
  return ensureRequiredProperties({
    ...dbResponse,
    metadata: safeParseJson(dbResponse.metadata),
    monthly_targets: safeParseJson(dbResponse.monthly_targets),
    current_metrics: safeParseJson(dbResponse.current_metrics)
  });
};
