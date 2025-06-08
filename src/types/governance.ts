
export interface WorkflowDefinition {
  id: string;
  workflow_name: string;
  workflow_type: string;
  description?: string;
  workflow_steps: Record<string, any>; // Changed from WorkflowStep[] to match JSON type
  conditional_routing: Record<string, any>;
  escalation_rules: Record<string, any>;
  sla_config: Record<string, any>;
  is_active: boolean;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  step_number: number;
  step_name: string;
  approver_id?: string;
  approver_role?: string;
  approval_type: 'single' | 'multiple' | 'consensus';
  conditions?: Record<string, any>;
  timeout_hours?: number;
}

export interface WorkflowInstance {
  id: string;
  workflow_definition_id: string;
  instance_name?: string;
  entity_type: string;
  entity_id: string;
  current_step: number;
  workflow_status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'escalated' | 'cancelled';
  initiated_by?: string;
  initiated_at: string;
  completed_at?: string;
  sla_deadline?: string;
  escalation_count: number;
  workflow_data: Record<string, any>;
  step_history: WorkflowStepHistory[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepHistory {
  step_number: number;
  approver_id: string;
  action: 'approved' | 'rejected' | 'delegated';
  timestamp: string;
  comments?: string;
}

export interface WorkflowApproval {
  id: string;
  workflow_instance_id: string;
  step_number: number;
  approver_id?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'delegated';
  approval_date?: string;
  comments?: string;
  approval_method: string;
  delegated_to?: string;
  approval_data: Record<string, any>;
  created_at: string;
}

export interface AuditTrailEntry {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string; // Made optional to handle unknown type
  user_agent?: string;
  action_performed: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  change_summary?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  compliance_flags: string[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface ComplianceFramework {
  id: string;
  framework_name: string;
  framework_version?: string;
  framework_description?: string;
  requirements: Record<string, any>;
  assessment_criteria: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceViolation {
  id: string;
  rule_id?: string;
  entity_type: string;
  entity_id: string;
  violation_type: string;
  violation_description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive' | 'accepted_risk';
  assigned_to?: string;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  remediation_actions: any[];
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  risk_name: string;
  risk_category: string;
  risk_description?: string;
  likelihood_score: number;
  impact_score: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  entity_type?: string;
  entity_id?: string;
  identified_by?: string;
  owner_id?: string;
  status: 'identified' | 'assessed' | 'mitigating' | 'mitigated' | 'accepted' | 'transferred';
  mitigation_plan?: string;
  mitigation_deadline?: string;
  review_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RegulatoryReport {
  id: string;
  report_name: string;
  regulatory_body: string;
  report_type: string;
  reporting_period_start: string;
  reporting_period_end: string;
  submission_deadline?: string;
  report_status: 'draft' | 'in_review' | 'approved' | 'submitted' | 'acknowledged';
  report_data: Record<string, any>;
  submission_method?: string;
  submission_reference?: string;
  submitted_by?: string;
  submitted_at?: string;
  acknowledgment_received: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
