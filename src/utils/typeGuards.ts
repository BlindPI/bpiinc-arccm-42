
import type { TeamAnalytics } from '@/types/team-management';

export function safeConvertTeamAnalytics(data: any): TeamAnalytics {
  return {
    totalTeams: data?.total_teams || 0,
    activeTeams: data?.active_teams || 0,
    totalMembers: data?.total_members || 0,
    averageTeamSize: data?.average_team_size || 0,
    teamsByType: data?.teams_by_type || {},
    performanceMetrics: {
      averagePerformanceScore: data?.performance_average || 0,
      topPerformingTeams: data?.top_performing_teams || []
    },
    complianceMetrics: {
      compliantTeams: data?.compliant_teams || 0,
      pendingReviews: data?.pending_reviews || 0,
      overdueTasks: data?.overdue_tasks || 0
    },
    averagePerformance: data?.performance_average || 0,
    averageCompliance: data?.compliance_score || 0,
    teamsByLocation: data?.teams_by_location || {},
    performanceByTeamType: data?.performance_by_team_type || {},
    teamsByProvider: data?.teams_by_provider || {}
  };
}
