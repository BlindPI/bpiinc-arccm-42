// Type guards for database query results
import type { Profile, UserRole } from '@/types/supabase-schema';
import type { 
  SafeJson, 
  TeamMemberWithProfile, 
  Team, 
  ExtendedProfile, 
  ActivityLog, 
  UserCertification 
} from '@/types/user-management';

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

// Enhanced type guards for ExtendedProfile
export function isValidExtendedProfile(data: any): data is ExtendedProfile {
  return isValidProfile(data) &&
    typeof data.display_name === 'string' && // Required in ExtendedProfile
    (typeof data.status === 'string' && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(data.status)) &&
    (data.compliance_tier === undefined || typeof data.compliance_tier === 'string');
}

// ActivityLog type guard
export function isValidActivityLog(data: any): data is ActivityLog {
  return data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.user_id === 'string' &&
    typeof data.activity_type === 'string' &&
    typeof data.description === 'string' &&
    typeof data.created_at === 'string' &&
    (data.metadata === undefined || isSafeJson(data.metadata));
}

// UserCertification type guard
export function isValidUserCertification(data: any): data is UserCertification {
  return data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.user_id === 'string' &&
    typeof data.certification_name === 'string' &&
    typeof data.issued_date === 'string' &&
    typeof data.status === 'string' &&
    ['active', 'expired', 'revoked'].includes(data.status) &&
    typeof data.created_at === 'string' &&
    typeof data.updated_at === 'string' &&
    (data.certificate_id === undefined || typeof data.certificate_id === 'string') &&
    (data.expiry_date === undefined || typeof data.expiry_date === 'string') &&
    (data.metadata === undefined || isSafeJson(data.metadata));
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

export function isExtendedProfileArray(data: any): data is ExtendedProfile[] {
  return Array.isArray(data) && data.every(isValidExtendedProfile);
}

export function isActivityLogArray(data: any): data is ActivityLog[] {
  return Array.isArray(data) && data.every(isValidActivityLog);
}

export function isUserCertificationArray(data: any): data is UserCertification[] {
  return Array.isArray(data) && data.every(isValidUserCertification);
}

export function isTeamArray(data: any): data is Team[] {
  return Array.isArray(data) && data.every(isValidTeam);
}

export function isTeamMemberArray(data: any): data is TeamMemberWithProfile[] {
  return Array.isArray(data) && data.every(isValidTeamMember);
}

// Enhanced utility functions to safely extract data from query results
export function safeExtractProfile(data: any): Profile | null {
  if (isValidProfile(data)) {
    return data;
  }
  return null;
}

export function safeExtractExtendedProfile(data: any): ExtendedProfile | null {
  if (isValidExtendedProfile(data)) {
    return data;
  }
  return null;
}

export function safeExtractActivityLog(data: any): ActivityLog | null {
  if (isValidActivityLog(data)) {
    return data;
  }
  return null;
}

export function safeExtractUserCertification(data: any): UserCertification | null {
  if (isValidUserCertification(data)) {
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

export function safeExtractExtendedProfiles(data: any): ExtendedProfile[] {
  if (isExtendedProfileArray(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.filter(isValidExtendedProfile);
  }
  return [];
}

export function safeExtractActivityLogs(data: any): ActivityLog[] {
  if (isActivityLogArray(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.filter(isValidActivityLog);
  }
  return [];
}

export function safeExtractUserCertifications(data: any): UserCertification[] {
  if (isUserCertificationArray(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.filter(isValidUserCertification);
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

// Enhanced Supabase response type guards with better error handling
export function isSuccessfulQuery<T>(response: { data: T | null; error: any }): response is { data: T; error: null } {
  return response.error === null && response.data !== null;
}

export function isFailedQuery<T>(response: { data: T | null; error: any }): response is { data: null; error: any } {
  return response.error !== null;
}

// Comprehensive query result handlers with error boundaries
export interface QueryResult<T> {
  data: T | null;
  error: string | null;
  isSuccess: boolean;
  isLoading: boolean;
}

export function createSafeQueryResult<T>(
  data: T | null = null, 
  error: string | null = null, 
  isLoading: boolean = false
): QueryResult<T> {
  return {
    data,
    error,
    isSuccess: error === null && data !== null,
    isLoading
  };
}

export function handleSupabaseResponse<T>(
  response: { data: T | null; error: any },
  validator?: (data: any) => data is T
): QueryResult<T> {
  try {
    if (isFailedQuery(response)) {
      return createSafeQueryResult<T>(null, response.error?.message || 'Database query failed');
    }
    
    if (isSuccessfulQuery(response)) {
      // Apply optional validator if provided
      if (validator && !validator(response.data)) {
        return createSafeQueryResult<T>(null, 'Data validation failed');
      }
      return createSafeQueryResult<T>(response.data, null);
    }
    
    return createSafeQueryResult<T>(null, 'Invalid query response format');
  } catch (error) {
    return createSafeQueryResult<T>(null, `Query processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Type-safe wrappers for common Supabase query patterns
export function handleUserQuery(response: { data: any; error: any }): QueryResult<ExtendedProfile[]> {
  return handleSupabaseResponse(response, isExtendedProfileArray);
}

export function handleSingleUserQuery(response: { data: any; error: any }): QueryResult<ExtendedProfile> {
  return handleSupabaseResponse(response, isValidExtendedProfile);
}

export function handleActivityLogQuery(response: { data: any; error: any }): QueryResult<ActivityLog[]> {
  return handleSupabaseResponse(response, isActivityLogArray);
}

export function handleUserCertificationQuery(response: { data: any; error: any }): QueryResult<UserCertification[]> {
  return handleSupabaseResponse(response, isUserCertificationArray);
}

export function handleTeamQuery(response: { data: any; error: any }): QueryResult<Team[]> {
  return handleSupabaseResponse(response, isTeamArray);
}