
export type EnrollmentSyncStatus = 'PENDING' | 'SYNCED' | 'ERROR' | 'NOT_FOUND' | 'MANUAL_REVIEW';
export type SyncType = 'MANUAL' | 'SCHEDULED' | 'BULK' | 'AUTOMATIC';
export type SyncLogStatus = 'SUCCESS' | 'ERROR' | 'PARTIAL';

export interface Enrollment {
  id: string;
  user_id: string;
  course_offering_id: string;
  enrollment_date: string;
  status: 'ENROLLED' | 'WAITLISTED' | 'CANCELLED' | 'COMPLETED';
  attendance: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
  attendance_notes?: string | null;
  waitlist_position?: number | null;
  // Thinkific Integration Fields
  thinkific_course_id?: string | null;
  thinkific_enrollment_id?: string | null;
  thinkific_user_id?: string | null;
  completion_percentage?: number | null;
  thinkific_started_at?: string | null;
  thinkific_completed_at?: string | null;
  practical_score?: number | null;
  written_score?: number | null;
  total_score?: number | null;
  last_thinkific_sync?: string | null;
  sync_status?: EnrollmentSyncStatus | null;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentInsert extends Omit<Enrollment, 'id' | 'created_at' | 'updated_at' | 'enrollment_date'> {
  enrollment_date?: string;
  attendance_notes?: string;
}

export interface WaitlistEntry extends Enrollment {
  position: number;
  notification_sent: boolean;
}

export interface CoursePrerequisite {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

// Extended enrollment interface with computed Thinkific fields
export interface EnrollmentWithThinkific extends Enrollment {
  // Computed Fields for UI Display
  completion_percentage?: number; // 0-100 percentage
  overall_passed?: boolean;
  has_thinkific_data?: boolean;
  sync_health_status?: 'HEALTHY' | 'STALE' | 'ERROR' | 'NEVER_SYNCED';
  days_since_last_sync?: number;
  
  // Assessment breakdown for detailed view
  assessment_breakdown?: {
    practical: {
      score?: number;
      passed?: boolean;
      weight: number;
    };
    written: {
      score?: number;
      passed?: boolean;
      weight: number;
    };
    total: {
      score?: number;
      passed?: boolean;
      threshold: number;
    };
  };
}

// Course mapping interface
export interface CourseThinkificMapping {
  id: string;
  course_offering_id: string;
  thinkific_course_id: string;
  thinkific_course_name?: string;
  mapping_created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Sync log interface
export interface EnrollmentSyncLog {
  id: string;
  enrollment_id: string;
  sync_type: SyncType;
  sync_status: SyncLogStatus;
  thinkific_data?: any; // JSON data from Thinkific
  error_message?: string;
  sync_duration_ms?: number;
  synced_by?: string;
  created_at: string;
}

// Bulk sync operation interface
export interface BulkSyncOperation {
  id: string;
  total_enrollments: number;
  processed_count: number;
  success_count: number;
  error_count: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  started_at: string;
  completed_at?: string;
  initiated_by: string;
  error_summary?: string[];
}

// Sync result interface for API responses
export interface EnrollmentSyncResult {
  enrollment_id: string;
  success: boolean;
  thinkific_data?: {
    enrollment: any;
    assessments: any[];
    assessment_results: any[];
    overall_score?: {
      practical: number;
      written: number;
      total: number;
      passed: boolean;
    };
  };
  error?: string;
  sync_duration_ms: number;
}

// Batch sync request interface
export interface BatchSyncRequest {
  enrollment_ids: string[];
  force_update?: boolean;
  sync_type: SyncType;
}

// Batch sync response interface
export interface BatchSyncResponse {
  operation_id: string;
  total_requested: number;
  results: EnrollmentSyncResult[];
  summary: {
    successful: number;
    failed: number;
    skipped: number;
  };
  errors: Array<{
    enrollment_id: string;
    error: string;
  }>;
}

export interface EnrollmentFormData {
  user_id: string;
  course_offering_id: string;
  attendance_notes?: string;
  // Optional Thinkific mapping data
  thinkific_course_id?: string;
  auto_sync_enabled?: boolean;
}

// Helper interfaces for Thinkific data transformation
export interface ThinkificEnrollmentData {
  id: number;
  user_id: number;
  course_id: number;
  percentage_completed: number;
  completed_at: string | null;
  started_at: string;
  activated_at: string;
}

export interface ThinkificScoreData {
  practical: number;
  written: number;
  total: number;
  passed: boolean;
}

// Utility type guards
export const isValidSyncStatus = (status: string): status is EnrollmentSyncStatus => {
  return ['PENDING', 'SYNCED', 'ERROR', 'NOT_FOUND', 'MANUAL_REVIEW'].includes(status);
};

export const isValidSyncType = (type: string): type is SyncType => {
  return ['MANUAL', 'SCHEDULED', 'BULK', 'AUTOMATIC'].includes(type);
};

export const isValidSyncLogStatus = (status: string): status is SyncLogStatus => {
  return ['SUCCESS', 'ERROR', 'PARTIAL'].includes(status);
};

// Helper functions for Thinkific data
export const hasThinkificData = (enrollment: Enrollment): boolean => {
  return !!(enrollment.thinkific_enrollment_id && enrollment.thinkific_course_id);
};

export const calculateSyncHealthStatus = (enrollment: Enrollment): 'HEALTHY' | 'STALE' | 'ERROR' | 'NEVER_SYNCED' => {
  if (!enrollment.last_thinkific_sync) {
    return 'NEVER_SYNCED';
  }
  
  if (enrollment.sync_status === 'ERROR') {
    return 'ERROR';
  }
  
  const lastSync = new Date(enrollment.last_thinkific_sync);
  const daysSince = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince > 7) {
    return 'STALE';
  }
  
  return 'HEALTHY';
};

export const calculateDaysSinceLastSync = (enrollment: Enrollment): number | null => {
  if (!enrollment.last_thinkific_sync) {
    return null;
  }
  
  const lastSync = new Date(enrollment.last_thinkific_sync);
  return Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatSyncStatus = (status: EnrollmentSyncStatus | null): string => {
  if (!status) return 'Not Synced';
  
  switch (status) {
    case 'PENDING': return 'Sync Pending';
    case 'SYNCED': return 'Synced';
    case 'ERROR': return 'Sync Error';
    case 'NOT_FOUND': return 'Not Found in Thinkific';
    case 'MANUAL_REVIEW': return 'Needs Review';
    default: return 'Unknown Status';
  }
};

// UI Helper Functions
export const getSyncHealthColor = (enrollment: Enrollment): string => {
  const health = calculateSyncHealthStatus(enrollment);
  switch (health) {
    case 'HEALTHY': return 'success';
    case 'STALE': return 'secondary';
    case 'ERROR': return 'destructive';
    case 'NEVER_SYNCED': return 'outline';
    default: return 'outline';
  }
};

export const getDisplayProgress = (enrollment: Enrollment): number => {
  return enrollment.completion_percentage || 0;
};

export const getDisplayScore = (enrollment: Enrollment): string => {
  if (enrollment.total_score !== null && enrollment.total_score !== undefined) {
    return `${enrollment.total_score}%`;
  }
  return 'N/A';
};

export const getSyncStatusBadgeVariant = (status: EnrollmentSyncStatus | null): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
  switch (status) {
    case 'SYNCED': return 'success';
    case 'PENDING': return 'secondary';
    case 'ERROR': return 'destructive';
    case 'NOT_FOUND': return 'destructive';
    case 'MANUAL_REVIEW': return 'outline';
    default: return 'outline';
  }
};

// Additional types for sync service compatibility
export type ThinkificSyncStatus = EnrollmentSyncStatus;
export interface ThinkificSyncResult extends EnrollmentSyncResult {}
export interface ThinkificCourseMapping extends CourseThinkificMapping {
  localCourseId: string;
  thinkificCourseId: string;
  courseName?: string;
  thinkificCourseName?: string;
  isActive: boolean;
  createdAt: string;
  courseOfferings?: any[];
}
