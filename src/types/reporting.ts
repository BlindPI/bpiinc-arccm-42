
export interface InstructorPerformanceMetrics {
  instructorId: string;
  instructorName: string;
  role: string;
  totalSessions: number;
  totalHours: number;
  averageSessionRating: number;
  studentsCount: number;
  certificatesIssued: number;
  complianceScore: number;
  monthlyTrend: MonthlyMetric[];
}

export interface MonthlyMetric {
  month: string;
  sessions: number;
  hours: number;
  rating: number;
}

export interface TeachingLoadReport {
  instructorId: string;
  instructorName: string;
  currentLoad: number;
  optimalLoad: number;
  utilizationRate: number;
  burnoutRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}

export interface ComplianceReport {
  instructorId: string;
  instructorName: string;
  role: string;
  overallScore: number;
  areas: ComplianceArea[];
  lastAuditDate: string;
  nextAuditDue: string;
  status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
}

export interface ComplianceArea {
  area: string;
  score: number;
  status: 'PASS' | 'FAIL' | 'NEEDS_ATTENTION';
  details: string;
}

export interface ExecutiveDashboardMetrics {
  totalUsers: number;
  activeInstructors: number;
  totalCertificates: number;
  monthlyGrowth: number;
  systemHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  complianceRate: number;
  utilizationRate: number;
  topPerformers: InstructorPerformanceMetrics[];
  alerts: SystemAlert[];
}

export interface SystemAlert {
  id: string;
  type: 'WARNING' | 'ERROR' | 'INFO';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface ReportSchedule {
  id: string;
  name: string;
  type: 'INSTRUCTOR_PERFORMANCE' | 'COMPLIANCE' | 'EXECUTIVE_SUMMARY';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  recipients: string[];
  enabled: boolean;
  lastGenerated: string;
  nextGeneration: string;
}
