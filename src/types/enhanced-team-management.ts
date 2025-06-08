
// Enhanced Team Management Types for Phase 2
export interface MemberSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: number; // 1-5
  certified: boolean;
  certification_date?: string;
  expiry_date?: string;
  verified_by?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  contact_name: string;
  relationship: string;
  primary_phone: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ComplianceRequirement {
  id: string;
  requirement_name: string;
  description?: string;
  requirement_type: string;
  frequency_days?: number;
  is_mandatory: boolean;
  applicable_roles?: string[];
  created_at: string;
  updated_at: string;
}

export interface MemberComplianceStatus {
  id: string;
  user_id: string;
  requirement_id: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'expired';
  last_checked: string;
  next_due_date?: string;
  compliance_data: Record<string, any>;
  checked_by?: string;
  created_at: string;
  updated_at: string;
  requirement?: ComplianceRequirement;
}

export interface BulkOperation {
  id: string;
  operation_name: string;
  operation_type: string;
  initiated_by: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  operation_data: Record<string, any>;
  progress_percentage: number;
  error_log: any[];
  rollback_data?: Record<string, any>;
  can_rollback: boolean;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalChain {
  id: string;
  chain_name: string;
  workflow_type: string;
  steps: ApprovalStep[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStep {
  step_number: number;
  approver_roles: string[];
  approver_users?: string[];
  required_approvals: number;
  description: string;
}

export interface ApprovalRequest {
  id: string;
  chain_id?: string;
  request_type: string;
  requested_by: string;
  current_step: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  request_data: Record<string, any>;
  approval_history: ApprovalHistoryEntry[];
  created_at: string;
  updated_at: string;
  chain?: ApprovalChain;
}

export interface ApprovalHistoryEntry {
  step: number;
  approver_id: string;
  action: 'approved' | 'rejected';
  comments?: string;
  timestamp: string;
}

export interface ComplianceSummary {
  user_id: string;
  total_requirements: number;
  compliant_count: number;
  compliance_percentage: number;
  checked_at: string;
}

export interface DataRetentionPolicy {
  id: string;
  policy_name: string;
  data_type: string;
  retention_period_days: number;
  deletion_method: string;
  is_active: boolean;
  applicable_conditions: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
