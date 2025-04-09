
// Database view interfaces for Supabase integration
import { Json } from '@/integrations/supabase/types';
import { UserRole } from './supabase-schema';

export interface CompletionSummary {
  course_id: string;
  course_name: string;
  instructor_id: string;
  total_sessions: number;
  completed_sessions: number;
  total_hours: number;
  last_session_date: string | null;
  completion_statuses: string;
}

export interface CertificationRequirement {
  course_id: string;
  min_sessions: number;
  required_hours: number;
}

export interface EvaluableTeachingSession {
  teaching_session_id: string;
  instructor_id: string;
  instructor_name: string;
  course_name: string;
  session_date: string;
  evaluation_id: string | null;
}

export interface ActiveSupervisionRelationship {
  id: string;
  supervisor_id: string;
  supervisee_id: string;
  supervisor_name: string | null;
  supervisor_role: UserRole | null;
  supervisee_name: string | null;
  supervisee_role: UserRole | null;
  status: string;
  created_at: string;
}

export interface ActiveSupervisor {
  supervisor_id: string;
  supervisor_name: string | null;
  supervisor_role: UserRole | null;
  supervisee_count: number;
}

export interface SupervisionProgress {
  supervisee_id: string;
  supervisor_id: string;
  cumulative_score: number | null;
  evaluation_count: number | null;
  avg_teaching_competency: number | null;
}

// Extend the Database types to include our views
declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Views: {
        course_completion_summary: CompletionSummary;
        certification_requirements: CertificationRequirement;
        evaluable_teaching_sessions: EvaluableTeachingSession;
        active_supervision_relationships: ActiveSupervisionRelationship;
        active_supervisors: ActiveSupervisor;
        supervision_progress: SupervisionProgress;
      };
    };
  }
}
