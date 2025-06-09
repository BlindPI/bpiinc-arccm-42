
// Type guards and safe conversion utilities

export function safeConvertTeamAnalytics(data: any): any {
  if (!data || typeof data !== 'object') {
    return {
      totalTeams: 0,
      totalMembers: 0,
      averagePerformance: 0,
      averageCompliance: 0,
      teamsByLocation: {},
      performanceByTeamType: {}
    };
  }

  return {
    totalTeams: data.total_teams || 0,
    totalMembers: data.total_members || 0,
    averagePerformance: data.performance_average || 0,
    averageCompliance: data.compliance_score || 0,
    teamsByLocation: data.teamsByLocation || {},
    performanceByTeamType: data.performanceByTeamType || {}
  };
}

export function safeCRMStats(data: any): any {
  if (!data || typeof data !== 'object') {
    return {
      total_leads: 0,
      total_opportunities: 0,
      total_pipeline_value: 0,
      total_activities: 0,
      conversion_rate: 0,
      win_rate: 0,
      average_deal_size: 0,
      totalCertificates: 0,
      pendingRequests: 0
    };
  }

  return {
    ...data,
    totalCertificates: data.totalCertificates || 0,
    pendingRequests: data.pendingRequests || 0
  };
}
