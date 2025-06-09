
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

export function safeConvertExecutiveMetrics(data: any): any {
  if (!data || typeof data !== 'object') {
    return {
      totalUsers: 0,
      activeCourses: 0,
      totalCertificates: 0,
      pendingRequests: 0,
      systemHealth: {
        status: 'unknown',
        message: 'No data available'
      }
    };
  }

  return {
    totalUsers: data.totalUsers || 0,
    activeCourses: data.activeCourses || 0,
    totalCertificates: data.totalCertificates || 0,
    pendingRequests: data.pendingRequests || 0,
    systemHealth: data.systemHealth || {
      status: 'unknown',
      message: 'No data available'
    }
  };
}

export function safeConvertComplianceMetrics(data: any): any {
  if (!data || typeof data !== 'object') {
    return {
      overallCompliance: 0,
      activeIssues: 0,
      resolvedIssues: 0,
      complianceByLocation: {},
      riskLevel: 'unknown'
    };
  }

  return {
    overallCompliance: data.overallCompliance || 0,
    activeIssues: data.activeIssues || 0,
    resolvedIssues: data.resolvedIssues || 0,
    complianceByLocation: data.complianceByLocation || {},
    riskLevel: data.riskLevel || 'unknown'
  };
}

export function safeConvertUserRole(role: any): string[] {
  if (Array.isArray(role)) {
    return role;
  }
  if (typeof role === 'string') {
    return [role];
  }
  return [];
}
