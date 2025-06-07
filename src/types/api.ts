
// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Common API error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Teaching and Compliance types
export interface TeachingData {
  id: string;
  instructor_id: string;
  session_date: string;
  duration_minutes: number;
  teaching_hours_credit: number;
  compliance_status: 'pending' | 'compliant' | 'non_compliant';
}

export interface ComplianceData {
  user_id: string;
  compliance_score: number;
  last_evaluation: string;
  requirements_met: number;
  total_requirements: number;
}

export interface DocumentRequirement {
  id: string;
  requirement_type: string;
  description: string;
  required_for_roles: string[];
  is_mandatory: boolean;
}

export interface DocumentSubmission {
  id: string;
  user_id: string;
  requirement_id: string;
  file_url: string;
  submission_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_notes?: string;
}
