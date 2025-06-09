
import { UserRole } from '@/types/supabase-schema';

export interface DashboardConfig {
  welcomeMessage: string;
  subtitle: string;
  widgets: string[];
}

export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  compliance_status?: boolean;
  created_at: string;
  updated_at: string;
}

// Dashboard widget data interfaces
export interface StudentCertificate {
  id: string;
  courseName: string;
  status: string;
  issueDate: string;
  expiryDate: string;
}

export interface StudentEnrollment {
  id: string;
  courseName: string;
  status: string;
  startDate?: string;
  progress: number;
}

export interface InstructorSession {
  id: string;
  courseName: string;
  sessionDate: string;
  attendanceCount: number;
  duration: number;
}

export interface ComplianceData {
  score: number;
  status: string;
  lastEvaluation?: string;
}

export function createDefaultDashboardConfig(role: UserRole): DashboardConfig {
  switch (role) {
    case 'SA':
      return {
        welcomeMessage: 'System Administrator Dashboard',
        subtitle: 'Manage the entire training system',
        widgets: ['users', 'compliance', 'analytics', 'system-health']
      };
    case 'AD':
      return {
        welcomeMessage: 'Administrator Dashboard',
        subtitle: 'Manage training operations',
        widgets: ['users', 'courses', 'certificates', 'reports']
      };
    case 'AP':
      return {
        welcomeMessage: 'Team Leader Dashboard',
        subtitle: 'Manage your team and training activities',
        widgets: ['team-overview', 'performance', 'assignments']
      };
    case 'IT':
    case 'IC':
    case 'IP':
      return {
        welcomeMessage: 'Instructor Dashboard',
        subtitle: 'Manage your teaching activities',
        widgets: ['sessions', 'students', 'certifications', 'compliance']
      };
    case 'ST':
      return {
        welcomeMessage: 'Student Dashboard',
        subtitle: 'Track your learning progress',
        widgets: ['courses', 'certificates', 'progress']
      };
    default:
      return {
        welcomeMessage: 'Dashboard',
        subtitle: 'Welcome to the training system',
        widgets: []
      };
  }
}
