import { Database } from '@/integrations/supabase/types';

// Define specific type aliases to prevent deep type instantiation
export type Tables = Database['public']['Tables'];
export type Views = Database['public']['Views'];

// Core table row types
export type ProfileRow = Tables['profiles']['Row'];
export type TeamRow = Tables['teams']['Row'];
export type TeamMemberRow = Tables['team_members']['Row'];
export type LocationRow = Tables['locations']['Row'];
export type CertificateRow = Tables['certificates']['Row'];
export type CourseScheduleRow = Tables['course_schedules']['Row'];
export type WorkflowInstanceRow = Tables['workflow_instances']['Row'];

// Workflow approval type (may not exist in current schema)
export type WorkflowApprovalRow = {
  id: string;
  workflow_instance_id: string;
  approver_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

// Insert types
export type ProfileInsert = Tables['profiles']['Insert'];
export type TeamInsert = Tables['teams']['Insert'];
export type TeamMemberInsert = Tables['team_members']['Insert'];
export type WorkflowInstanceInsert = Tables['workflow_instances']['Insert'];

// Update types
export type ProfileUpdate = Tables['profiles']['Update'];
export type TeamUpdate = Tables['teams']['Update'];
export type TeamMemberUpdate = Tables['team_members']['Update'];

// Complex joined types with safe nesting
export type TeamWithMembers = TeamRow & {
  team_members?: TeamMemberRow[];
};

export type TeamMemberWithProfile = TeamMemberRow & {
  profiles?: ProfileRow;
};

export type WorkflowWithApprovals = WorkflowInstanceRow & {
  workflow_approvals?: WorkflowApprovalRow[];
};

// Query result types for common patterns
export type SupabaseQueryResult<T> = {
  data: T[] | null;
  error: any | null;
};

export type SupabaseSingleResult<T> = {
  data: T | null;
  error: any | null;
};

// Notification related types (for missing tables)
export type NotificationPreference = {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  frequency: string;
  created_at: string;
  updated_at: string;
};

export type NotificationType = {
  id: string;
  name: string;
  description: string;
  category: string;
  default_enabled: boolean;
  created_at: string;
  updated_at: string;
};

// Course related types (for missing fields)
export type CourseRow = {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  duration_hours?: number;
  instructor_id?: string;
  location_id?: string;
};

// Safe type casting utilities
export const safeTypeCast = {
  asTeamRow: (data: any): TeamRow | null => {
    if (!data || typeof data !== 'object') return null;
    return data as TeamRow;
  },
  
  asProfileRow: (data: any): ProfileRow | null => {
    if (!data || typeof data !== 'object') return null;
    return data as ProfileRow;
  },
  
  asTeamMemberRow: (data: any): TeamMemberRow | null => {
    if (!data || typeof data !== 'object') return null;
    return data as TeamMemberRow;
  },
  
  asWorkflowRow: (data: any): WorkflowInstanceRow | null => {
    if (!data || typeof data !== 'object') return null;
    return data as WorkflowInstanceRow;
  }
};

// Type guards for runtime safety
export const isValidTeamRow = (data: any): data is TeamRow => {
  return data && typeof data === 'object' && typeof data.id === 'string';
};

export const isValidProfileRow = (data: any): data is ProfileRow => {
  return data && typeof data === 'object' && typeof data.id === 'string';
};

export const isValidWorkflowRow = (data: any): data is WorkflowInstanceRow => {
  return data && typeof data === 'object' && typeof data.id === 'string';
};