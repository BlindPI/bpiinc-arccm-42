
import { Json } from '@/integrations/supabase/types';

// Type guards for safe JSON conversion
export function isExecutiveMetrics(data: unknown): data is {
  totalUsers: number;
  activeInstructors: number;
  totalCertificates: number;
  monthlyGrowth: number;
  complianceScore: number;
  performanceIndex: number;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).totalUsers === 'number' &&
    typeof (data as any).activeInstructors === 'number' &&
    typeof (data as any).totalCertificates === 'number' &&
    typeof (data as any).monthlyGrowth === 'number' &&
    typeof (data as any).complianceScore === 'number' &&
    typeof (data as any).performanceIndex === 'number'
  );
}

export function isTeamAnalytics(data: unknown): data is {
  total_teams: number;
  total_members: number;
  performance_average: number;
  compliance_score: number;
  cross_location_teams: number;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).total_teams === 'number' &&
    typeof (data as any).total_members === 'number' &&
    typeof (data as any).performance_average === 'number' &&
    typeof (data as any).compliance_score === 'number' &&
    typeof (data as any).cross_location_teams === 'number'
  );
}

export function isComplianceMetrics(data: unknown): data is {
  overall_compliance: number;
  active_issues: number;
  resolved_issues: number;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).overall_compliance === 'number' &&
    typeof (data as any).active_issues === 'number' &&
    typeof (data as any).resolved_issues === 'number'
  );
}

// Safe JSON converter with fallbacks
export function safeConvertExecutiveMetrics(data: Json | null): {
  totalUsers: number;
  activeInstructors: number;
  totalCertificates: number;
  monthlyGrowth: number;
  complianceScore: number;
  performanceIndex: number;
} {
  if (isExecutiveMetrics(data)) {
    return data;
  }
  
  // Fallback with safe defaults
  return {
    totalUsers: 0,
    activeInstructors: 0,
    totalCertificates: 0,
    monthlyGrowth: 0,
    complianceScore: 0,
    performanceIndex: 0
  };
}

export function safeConvertTeamAnalytics(data: Json | null): {
  total_teams: number;
  total_members: number;
  performance_average: number;
  compliance_score: number;
  cross_location_teams: number;
} {
  if (isTeamAnalytics(data)) {
    return data;
  }
  
  return {
    total_teams: 0,
    total_members: 0,
    performance_average: 0,
    compliance_score: 0,
    cross_location_teams: 0
  };
}

export function safeConvertComplianceMetrics(data: Json | null): {
  overall_compliance: number;
  active_issues: number;
  resolved_issues: number;
} {
  if (isComplianceMetrics(data)) {
    return data;
  }
  
  return {
    overall_compliance: 0,
    active_issues: 0,
    resolved_issues: 0
  };
}
