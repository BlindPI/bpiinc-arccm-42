// COMPLIANCE SYSTEM TYPES
// Standalone types for compliance management to resolve import issues

export interface UserComplianceRecord {
  id: string;
  user_id: string;
  metric_id: string;
  status: string;
  completion_percentage: number;
  current_value: string | null;
  target_value: string | null;
  evidence_files: any;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  compliance_status: string | null;
  next_check_due?: string | null;
}

export interface ComplianceMetric {
  id: string;
  name: string;
  category: string;
  required_for_roles: string | null;
  applicable_tiers: string | null;
  measurement_type: string;
  target_value: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDocument {
  id: string;
  user_id: string;
  metric_id: string;
  document_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  verification_status: string;
  expiry_date: string | null;
  is_current: boolean;
  uploaded_by: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceAction {
  id: string;
  user_id: string;
  metric_id: string;
  action_type: string;
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  status: string;
  assigned_by: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  compliance_tier: string | null;
  compliance_status: boolean | null;
  performance_score: number | null;
  training_hours: number | null;
  phone: string | null;
  organization: string | null;
  job_title: string | null;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  read: boolean;
  created_at: string;
  user_id: string | null;
  certificate_request_id: string | null;
  batch_id: string | null;
  notification_type: string | null;
  email_sent: boolean | null;
}

export interface AvailabilityType {
  available: string;
  unavailable: string;
  tentative: string;
}

export interface BookingType {
  training: string;
  meeting: string;
  break: string;
  travel: string;
}

export interface UserAvailabilitySlot {
  id: string;
  user_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  availability_type: string;
  recurring_pattern: string | null;
  time_slot_duration: number | null;
  created_at: string;
  updated_at: string;
}

export interface Json {
  [key: string]: any;
}