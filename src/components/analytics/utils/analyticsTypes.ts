
// Consolidated analytics types to prevent conflicts
export interface EnhancedRealPerformanceData {
  totalCertificates: number;
  activeSessions: number;
  completionRate: number;
  averageSatisfactionScore: number;
  complianceScore: number;
  performanceRating: number;
  efficiencyRating: number;
}

export interface EnhancedRealTeamStats {
  totalTeams: number;
  activeMembers: number;
  averagePerformance: number;
  performanceScore: number;
}

export interface EnhancedAnalyticsReport {
  id: string;
  name: string;
  type: 'team' | 'compliance' | 'performance' | 'custom';
  data: any;
  generatedAt: string;
  generatedBy: string;
  parameters: Record<string, any>;
  description: string;
  report_type: string;
  is_automated: boolean;
}
