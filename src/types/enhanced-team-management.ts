
export interface TeamMemberAssignment {
  id: string;
  team_member_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  assigned_by: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  location?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
}

export interface TeamLocationAssignment {
  id: string;
  team_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  location_name?: string;
}

export interface TeamPerformanceMetric {
  id: string;
  team_id: string;
  metric_type: string;
  metric_value: number;
  period_start: string;
  period_end: string;
  recorded_by: string;
  recorded_date: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TeamWorkflow {
  id: string;
  team_id: string;
  workflow_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_by: string;
  approved_by?: string;
  request_data: Record<string, any>;
  approval_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface MemberStatusChange {
  id: string;
  team_member_id: string;
  old_status?: string;
  new_status: string;
  old_role?: string;
  new_role?: string;
  changed_by: string;
  reason?: string;
  effective_date: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface EnhancedTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  skills: string[];
  emergency_contact: Record<string, any>;
  notes?: string;
  last_activity?: string;
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
  display_name: string;
  profile?: {
    id: string;
    display_name: string;
    role: string;
    email?: string;
  };
  assignments?: TeamMemberAssignment[];
  status_history?: MemberStatusChange[];
}

export interface BulkMemberAction {
  action: 'update_status' | 'reassign_location' | 'update_role' | 'send_notification';
  member_ids: string[];
  data: Record<string, any>;
  reason?: string;
}

export interface LocationTransferRequest {
  member_id: string;
  team_id: string;
  from_location_id?: string;
  to_location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  reason: string;
  requires_approval: boolean;
  requested_by: string;
}
