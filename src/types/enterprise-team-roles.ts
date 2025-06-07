
export type EnterpriseTeamRole = 'OWNER' | 'LEAD' | 'ADMIN' | 'MEMBER' | 'OBSERVER';

export interface GranularPermission {
  id: string;
  name: string;
  description: string;
  category: 'member_management' | 'team_settings' | 'financial' | 'reporting' | 'workflow' | 'governance';
  requires_approval?: boolean;
  delegation_allowed?: boolean;
}

export interface TeamRolePermissions {
  role: EnterpriseTeamRole;
  permissions: string[]; // permission IDs
  inherits_from?: EnterpriseTeamRole;
  can_delegate: string[]; // permission IDs that can be delegated
  approval_required_for: string[]; // actions requiring approval
}

export interface TeamGovernanceRule {
  id: string;
  team_id: string;
  rule_type: 'approval_workflow' | 'delegation_policy' | 'escalation_rule';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  team_id: string;
  workflow_name: string;
  trigger_conditions: Record<string, any>;
  approval_steps: ApprovalStep[];
  auto_approve_conditions?: Record<string, any>;
  escalation_rules?: EscalationRule[];
  is_active: boolean;
}

export interface ApprovalStep {
  step_order: number;
  required_role: EnterpriseTeamRole;
  required_permissions: string[];
  approver_count: number;
  timeout_hours?: number;
  auto_approve_on_timeout?: boolean;
}

export interface EscalationRule {
  trigger_after_hours: number;
  escalate_to_role: EnterpriseTeamRole;
  notification_message: string;
}

export interface PendingApproval {
  id: string;
  team_id: string;
  workflow_id: string;
  requested_by: string;
  request_type: string;
  request_data: Record<string, any>;
  current_step: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';
  approvals: ApprovalRecord[];
  created_at: string;
  expires_at?: string;
}

export interface ApprovalRecord {
  step: number;
  approver_id: string;
  approval_status: 'approved' | 'rejected';
  comments?: string;
  approved_at: string;
}

// Default permission definitions
export const ENTERPRISE_PERMISSIONS: GranularPermission[] = [
  // Member Management
  { id: 'view_members', name: 'View Members', description: 'View team member list and profiles', category: 'member_management' },
  { id: 'add_members', name: 'Add Members', description: 'Add new members to the team', category: 'member_management', requires_approval: true },
  { id: 'remove_members', name: 'Remove Members', description: 'Remove members from the team', category: 'member_management', requires_approval: true },
  { id: 'modify_member_roles', name: 'Modify Member Roles', description: 'Change member roles and permissions', category: 'member_management', requires_approval: true },
  { id: 'view_member_performance', name: 'View Member Performance', description: 'Access member performance data', category: 'member_management' },
  
  // Team Settings
  { id: 'view_team_settings', name: 'View Team Settings', description: 'View team configuration and settings', category: 'team_settings' },
  { id: 'modify_team_settings', name: 'Modify Team Settings', description: 'Change team name, description, and basic settings', category: 'team_settings' },
  { id: 'manage_team_locations', name: 'Manage Team Locations', description: 'Assign and manage team locations', category: 'team_settings', requires_approval: true },
  { id: 'archive_team', name: 'Archive Team', description: 'Archive or deactivate the team', category: 'team_settings', requires_approval: true },
  
  // Financial
  { id: 'view_team_budget', name: 'View Team Budget', description: 'View team budget and financial data', category: 'financial' },
  { id: 'manage_team_budget', name: 'Manage Team Budget', description: 'Modify team budget allocations', category: 'financial', requires_approval: true },
  { id: 'approve_expenses', name: 'Approve Expenses', description: 'Approve team expense requests', category: 'financial', delegation_allowed: true },
  
  // Reporting
  { id: 'view_basic_reports', name: 'View Basic Reports', description: 'Access basic team reports', category: 'reporting' },
  { id: 'view_advanced_reports', name: 'View Advanced Reports', description: 'Access detailed analytics and reports', category: 'reporting' },
  { id: 'export_data', name: 'Export Data', description: 'Export team data and reports', category: 'reporting' },
  
  // Workflow
  { id: 'create_workflows', name: 'Create Workflows', description: 'Create and modify team workflows', category: 'workflow' },
  { id: 'approve_workflow_changes', name: 'Approve Workflow Changes', description: 'Approve changes to team workflows', category: 'workflow' },
  
  // Governance
  { id: 'manage_governance', name: 'Manage Governance', description: 'Manage team governance rules and policies', category: 'governance' },
  { id: 'delegate_permissions', name: 'Delegate Permissions', description: 'Delegate permissions to other members', category: 'governance' },
  { id: 'override_approvals', name: 'Override Approvals', description: 'Override pending approval workflows', category: 'governance' }
];

// Default role permission mappings
export const DEFAULT_ROLE_PERMISSIONS: Record<EnterpriseTeamRole, TeamRolePermissions> = {
  OWNER: {
    role: 'OWNER',
    permissions: ENTERPRISE_PERMISSIONS.map(p => p.id), // All permissions
    can_delegate: ENTERPRISE_PERMISSIONS.filter(p => p.delegation_allowed).map(p => p.id),
    approval_required_for: []
  },
  LEAD: {
    role: 'LEAD',
    permissions: [
      'view_members', 'add_members', 'modify_member_roles', 'view_member_performance',
      'view_team_settings', 'modify_team_settings', 'manage_team_locations',
      'view_team_budget', 'approve_expenses',
      'view_basic_reports', 'view_advanced_reports', 'export_data',
      'create_workflows', 'approve_workflow_changes'
    ],
    can_delegate: ['approve_expenses', 'view_basic_reports'],
    approval_required_for: ['add_members', 'remove_members', 'modify_member_roles', 'manage_team_locations']
  },
  ADMIN: {
    role: 'ADMIN',
    permissions: [
      'view_members', 'add_members', 'view_member_performance',
      'view_team_settings', 'modify_team_settings',
      'view_team_budget',
      'view_basic_reports', 'view_advanced_reports', 'export_data'
    ],
    can_delegate: ['view_basic_reports'],
    approval_required_for: ['add_members', 'modify_team_settings']
  },
  MEMBER: {
    role: 'MEMBER',
    permissions: [
      'view_members', 'view_team_settings', 'view_basic_reports'
    ],
    can_delegate: [],
    approval_required_for: []
  },
  OBSERVER: {
    role: 'OBSERVER',
    permissions: [
      'view_members', 'view_team_settings', 'view_basic_reports'
    ],
    can_delegate: [],
    approval_required_for: []
  }
};
