
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
  status: 'PENDING' | 'VALID' | 'EXPIRED' | 'INVALID';
  items: ComplianceItem[];
}

export interface ComplianceItem {
  id: string;
  name: string;
  status: 'PENDING' | 'VALID' | 'EXPIRED' | 'INVALID';
  expiry_date: string;
}

export interface DocumentRequirement {
  id: string;
  requirement_type: string;
  document_type: string;
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

// Task Management types
export interface TaskFilters {
  userId?: string;
  leadId?: string;
  contactId?: string;
  status?: string;
  include_subtasks?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  productivityScore: number;
  completionRate: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  productivity_score: number;
  completion_rate: number;
}

// Monitoring types
export interface ReportConfig {
  id: string;
  name: string;
  type: string;
  schedule?: string;
  enabled: boolean;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: string;
}
