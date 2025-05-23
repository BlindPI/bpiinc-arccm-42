export interface TeachingSession {
  id: string;
  instructor_id: string;
  course_offering_id?: string;
  session_date: string;
  hours_taught: number;
  students_present: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupervisorEvaluation {
  id: string;
  instructor_id: string;
  supervisor_id: string;
  evaluation_date: string;
  overall_rating: number;
  teaching_skills_rating: number;
  knowledge_rating: number;
  professionalism_rating: number;
  comments?: string;
  recommendations?: string;
  areas_for_improvement?: string;
  created_at: string;
  updated_at: string;
  supervisor?: UserProfile;
}