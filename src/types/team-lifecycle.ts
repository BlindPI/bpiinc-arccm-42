
export interface TeamWorkflow {
  id: string;
  team_id: string;
  workflow_type: string;
  request_data: Record<string, any>;
  requested_by: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_data?: Record<string, any>;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Relations for joins
  teams?: {
    name: string;
  };
  requester?: {
    display_name: string;
  };
}

export interface TeamLifecycleEvent {
  id: string;
  team_id: string;
  event_type: string;
  event_data: Record<string, any>;
  performed_by: string;
  affected_user_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
}

export interface TeamBulkOperation {
  id: string;
  team_id: string;
  operation_type: string;
  operation_data: Record<string, any>;
  performed_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: Record<string, any>;
  error_details?: string;
  created_at: string;
  completed_at?: string;
}

export interface BulkMemberOperation {
  type: 'add' | 'remove' | 'update_role' | 'transfer';
  member_ids?: string[];
  new_role?: 'MEMBER' | 'ADMIN';
  target_team_id?: string;
  user_emails?: string[];
}
