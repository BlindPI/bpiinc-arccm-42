
import type { TeamAnalytics } from '@/types/team-management';
import type { ExecutiveMetrics, ComplianceMetrics } from '@/types/supabase-schema';

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
    teamsByProvider: data?.teams_by_provider || {},
    // CRITICAL: Add missing properties to fix analytics
    total_teams: data?.total_teams || 0,
    total_members: data?.total_members || 0,
    performance_average: data?.performance_average || 0,
    compliance_score: data?.compliance_score || 0,
    cross_location_teams: data?.cross_location_teams || 0
  };
}

export function safeConvertExecutiveMetrics(data: any): ExecutiveMetrics {
  return {
    totalRevenue: data?.total_revenue || 0,
    totalUsers: data?.total_users || 0,
    activeProjects: data?.active_projects || 0,
    complianceScore: data?.compliance_score || 0,
    // CRITICAL: Add missing properties
    activeInstructors: data?.active_instructors || 0,
    totalCertificates: data?.total_certificates || 0,
    monthlyGrowth: data?.monthly_growth || 0,
    performanceIndex: data?.performance_index || 0
  };
}

export function safeConvertComplianceMetrics(data: any): ComplianceMetrics {
  return {
    overallScore: data?.overall_score || 0,
    compliantTeams: data?.compliant_teams || 0,
    pendingReviews: data?.pending_reviews || 0,
    criticalIssues: data?.critical_issues || 0,
    // CRITICAL: Add missing properties
    overall_compliance: data?.overall_compliance || data?.overall_score || 0,
    active_issues: data?.active_issues || data?.critical_issues || 0,
    resolved_issues: data?.resolved_issues || 0
  };
}
