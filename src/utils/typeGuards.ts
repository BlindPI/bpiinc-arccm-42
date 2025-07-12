// Type guards for database query results
import type { Profile, UserRole } from '@/types/supabase-schema';
import type { SafeJson, TeamMemberWithProfile, Team } from '@/types/user-management';

// User and Profile type guards
export function isValidProfile(data: any): data is Profile {
  return data && 
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.display_name === 'string' &&
    typeof data.role === 'string' &&
    typeof data.created_at === 'string' &&
    typeof data.updated_at === 'string';
}

export function isValidUserRole(role: any): role is UserRole {
  const validRoles = ['IT', 'IP', 'IC', 'AP', 'AD', 'SA'];
  return typeof role === 'string' && validRoles.includes(role);
}

export function hasValidCompliance(data: any): data is Profile & { compliance_status?: boolean; compliance_tier?: string } {
  return isValidProfile(data) &&
    (data.compliance_status === undefined || typeof data.compliance_status === 'boolean') &&
    (data.compliance_tier === undefined || typeof data.compliance_tier === 'string');
}

// Team type guards
export function isValidTeam(data: any): data is Team {
  return data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.team_type === 'string' &&
    typeof data.status === 'string' &&
    typeof data.performance_score === 'number' &&
    typeof data.created_at === 'string' &&
    typeof data.updated_at === 'string';
}

export function isValidTeamMember(data: any): data is TeamMemberWithProfile {
  return data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.team_id === 'string' &&
    typeof data.user_id === 'string' &&
    typeof data.role === 'string' &&
    typeof data.display_name === 'string' &&
    typeof data.created_at === 'string' &&
    typeof data.updated_at === 'string';
}

// Safe JSON type guard
export function isSafeJson(data: any): data is SafeJson {
  return data && typeof data === 'object' && !Array.isArray(data);
}

// Array type guards
export function isProfileArray(data: any): data is Profile[] {
  return Array.isArray(data) && data.every(isValidProfile);
}

export function isTeamArray(data: any): data is Team[] {
  return Array.isArray(data) && data.every(isValidTeam);
}

export function isTeamMemberArray(data: any): data is TeamMemberWithProfile[] {
  return Array.isArray(data) && data.every(isValidTeamMember);
}

// Utility function to safely extract user data from query results
export function safeExtractProfile(data: any): Profile | null {
  if (isValidProfile(data)) {
    return data;
  }
  return null;
}

export function safeExtractProfiles(data: any): Profile[] {
  if (isProfileArray(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.filter(isValidProfile);
  }
  return [];
}

export function safeExtractTeams(data: any): Team[] {
  if (isTeamArray(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.filter(isValidTeam);
  }
  return [];
}

export function safeExtractTeamMembers(data: any): TeamMemberWithProfile[] {
  if (isTeamMemberArray(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.filter(isValidTeamMember);
  }
  return [];
}

// Database error type guard
export function isDatabaseError(error: any): error is { message: string; code?: string } {
  return error && 
    typeof error === 'object' &&
    typeof error.message === 'string';
}

// Supabase response type guard
export function isSuccessfulQuery<T>(response: { data: T | null; error: any }): response is { data: T; error: null } {
  return response.error === null && response.data !== null;
}