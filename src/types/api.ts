
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

// Enhanced Task interface to match TaskManager component expectations
export interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Core task fields
  task_title: string;
  task_description?: string;
  task_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
  // Activity mapping fields (for compatibility)
  activity_type: string | null;
  activity_title: string | null;
  activity_description: string | null;
  duration: number | null;
  next_steps: string | null;
  activity_date: string | null;
  
  // Assignment and relationships
  user_id: string | null;
  assigned_to?: string;
  lead_id: string | null;
  contact_id: string | null;
  opportunity_id?: string;
  parent_task_id?: string;
  
  // Scheduling
  due_date?: string;
  reminder_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  completed_date?: string;
  
  // Additional features
  tags?: string[];
  notes?: string;
  attachments?: any[];
  is_recurring?: boolean;
  recurrence_pattern?: any;
  created_by?: string;
  
  // Subtasks support
  subtasks?: Task[];
}

// Enhanced Activity interface
export interface Activity {
  id: string;
  activity_type: string;
  activity_title: string;
  activity_description: string;
  duration: number;
  next_steps: string;
  lead_id: string;
  contact_id?: string;
  user_id: string;
  activity_date: string;
  created_at: string;
  updated_at: string;
  outcome?: 'pending' | 'successful' | 'failed' | 'cancelled';
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

// Enhanced Task Management types
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

// Enhanced Monitoring types
export interface ReportConfig {
  id: string;
  name: string;
  type: string;
  report_type?: string;
  schedule?: string | {
    enabled: boolean;
    frequency: string;
    time: string;
    recipients: string[];
  };
  enabled: boolean;
  format?: string;
  description?: string;
  data_sources?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'processing';
  progress: number;
  result?: string;
  started_at?: string;
  completed_at?: string;
  file_size?: number;
  requested_by?: string;
  error_message?: string;
  file_url?: string;
}
