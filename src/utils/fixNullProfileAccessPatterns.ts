/**
 * COMPREHENSIVE NULL PROFILE ACCESS PATTERN FIX
 * 
 * This utility systematically fixes ALL profile field access patterns across the codebase
 * to ensure users with null profile fields don't crash the application.
 * 
 * PROBLEM: profiles.email, profiles.phone, profiles.display_name can be NULL,
 *          and user objects themselves can be null, but components access properties directly
 * SOLUTION: Add comprehensive null safety checks for ALL profile fields
 */

// =====================================================================================
// SAFE PROFILE ACCESS UTILITIES
// =====================================================================================

/**
 * Safely get email from user object with fallback chain
 */
export function getSafeUserEmail(user: any): string | null {
  if (!user) return null;
  
  return user.email || 
         user.profiles?.email || 
         user.user?.email ||
         null;
}

/**
 * Safely get phone from user object with fallback chain
 */
export function getSafeUserPhone(user: any): string | null {
  if (!user) return null;
  
  return user.phone || 
         user.profiles?.phone || 
         user.user?.phone ||
         null;
}

/**
 * Safely get display_name from user object with fallback chain
 */
export function getSafeUserDisplayName(user: any): string {
  if (!user) return 'Unknown User';
  
  return user.display_name || 
         user.profiles?.display_name ||
         user.user?.display_name ||
         getSafeUserEmail(user) || 
         'Unknown User';
}

/**
 * Safely get organization from user object
 */
export function getSafeUserOrganization(user: any): string | null {
  if (!user) return null;
  
  return user.organization || 
         user.profiles?.organization || 
         user.user?.organization ||
         null;
}

/**
 * Safely get job_title from user object
 */
export function getSafeUserJobTitle(user: any): string | null {
  if (!user) return null;
  
  return user.job_title || 
         user.profiles?.job_title || 
         user.user?.job_title ||
         null;
}

/**
 * Safely get any profile field with fallback
 */
export function getSafeProfileField(user: any, fieldName: string): string | null {
  if (!user) return null;
  
  return user[fieldName] || 
         user.profiles?.[fieldName] || 
         user.user?.[fieldName] ||
         null;
}

/**
 * Display versions with fallbacks
 */
export function getSafeDisplayEmail(user: any): string {
  const email = getSafeUserEmail(user);
  return email || 'No email';
}

export function getSafeDisplayPhone(user: any): string {
  const phone = getSafeUserPhone(user);
  return phone || 'No phone';
}

export function getSafeDisplayOrganization(user: any): string {
  const org = getSafeUserOrganization(user);
  return org || 'No organization';
}

/**
 * Validation functions
 */
export function hasValidEmail(user: any): boolean {
  const email = getSafeUserEmail(user);
  return email !== null && email.trim() !== '';
}

export function hasValidPhone(user: any): boolean {
  const phone = getSafeUserPhone(user);
  return phone !== null && phone.trim() !== '';
}

export function hasValidDisplayName(user: any): boolean {
  if (!user) return false;
  const displayName = user.display_name || user.profiles?.display_name || user.user?.display_name;
  return displayName !== null && displayName !== undefined && displayName.trim() !== '';
}

/**
 * Safe search filter for any profile field
 */
export function safeProfileSearchFilter(user: any, searchTerm: string, fields: string[] = ['email', 'display_name', 'phone']): boolean {
  if (!searchTerm) return true;
  
  const searchLower = searchTerm.toLowerCase();
  
  return fields.some(field => {
    let value: string | null = null;
    
    switch (field) {
      case 'email':
        value = getSafeUserEmail(user);
        break;
      case 'phone':
        value = getSafeUserPhone(user);
        break;
      case 'display_name':
        value = user?.display_name || user?.profiles?.display_name || null;
        break;
      default:
        value = getSafeProfileField(user, field);
    }
    
    return value && value.toLowerCase().includes(searchLower);
  });
}

// =====================================================================================
// COMPONENT-SPECIFIC SAFE ACCESS PATTERNS
// =====================================================================================

/**
 * Safe access pattern for team member objects
 */
export interface SafeTeamMember {
  id: string;
  user_id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  organization: string | null;
  role: string;
  status: string;
  [key: string]: any;
}

/**
 * Transform team member to safe format
 */
export function makeSafeTeamMember(member: any): SafeTeamMember {
  const user = member.user || member; // Handle both nested and flat structures
  
  return {
    ...member,
    email: getSafeUserEmail(user),
    phone: getSafeUserPhone(user),
    display_name: user?.display_name || user?.profiles?.display_name || null,
    organization: getSafeUserOrganization(user),
    safe_display_name: getSafeUserDisplayName(user),
    safe_email: getSafeDisplayEmail(user),
    safe_phone: getSafeDisplayPhone(user),
    safe_organization: getSafeDisplayOrganization(user),
    has_email: hasValidEmail(user),
    has_phone: hasValidPhone(user),
    has_display_name: hasValidDisplayName(user),
    user: user ? {
      ...user,
      safe_email: getSafeDisplayEmail(user),
      safe_phone: getSafeDisplayPhone(user),
      safe_display_name: getSafeUserDisplayName(user)
    } : null
  };
}

/**
 * Safe access pattern for user objects
 */
export interface SafeUser {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  organization: string | null;
  role: string;
  status: string;
  [key: string]: any;
}

/**
 * Transform user to safe format
 */
export function makeSafeUser(user: any): SafeUser {
  return {
    ...user,
    email: getSafeUserEmail(user),
    phone: getSafeUserPhone(user),
    display_name: user?.display_name || user?.profiles?.display_name || null,
    organization: getSafeUserOrganization(user),
    safe_display_name: getSafeUserDisplayName(user),
    safe_email: getSafeDisplayEmail(user),
    safe_phone: getSafeDisplayPhone(user),
    safe_organization: getSafeDisplayOrganization(user),
    has_email: hasValidEmail(user),
    has_phone: hasValidPhone(user),
    has_display_name: hasValidDisplayName(user)
  };
}

// =====================================================================================
// REACT HOOKS FOR SAFE PROFILE ACCESS
// =====================================================================================

import { useMemo } from 'react';

/**
 * Hook to safely process team members list
 */
export function useSafeTeamMembers(members: any[] = []) {
  return useMemo(() => {
    return members.map(makeSafeTeamMember);
  }, [members]);
}

/**
 * Hook to safely process users list
 */
export function useSafeUsers(users: any[] = []) {
  return useMemo(() => {
    return users.map(makeSafeUser);
  }, [users]);
}

/**
 * Hook for safe user search filtering
 */
export function useSafeUserSearch(users: any[] = [], searchTerm: string = '', searchFields: string[] = ['email', 'display_name', 'phone']) {
  return useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    return users.filter(user => safeProfileSearchFilter(user, searchTerm, searchFields));
  }, [users, searchTerm, searchFields]);
}

// =====================================================================================
// MIGRATION UTILITIES
// =====================================================================================

/**
 * Replace unsafe profile field access patterns in component code
 */
export const PROFILE_ACCESS_PATTERNS = {
  // Direct field access without null check
  UNSAFE_EMAIL: /(\w+)\.email(?![A-Za-z_])/g,
  UNSAFE_PHONE: /(\w+)\.phone(?![A-Za-z_])/g,
  UNSAFE_DISPLAY_NAME: /(\w+)\.display_name(?![A-Za-z_])/g,
  
  // JSX field access without null check
  UNSAFE_JSX_EMAIL: /\{(\w+)\.email\}/g,
  UNSAFE_JSX_PHONE: /\{(\w+)\.phone\}/g,
  UNSAFE_JSX_DISPLAY_NAME: /\{(\w+)\.display_name\}/g,
  
  // Nested field access without null check  
  UNSAFE_USER_EMAIL: /(\w+)\.user\.email(?![A-Za-z_])/g,
  UNSAFE_USER_PHONE: /(\w+)\.user\.phone(?![A-Za-z_])/g,
  UNSAFE_USER_DISPLAY_NAME: /(\w+)\.user\.display_name(?![A-Za-z_])/g,
  
  // Search/filter patterns without null check
  UNSAFE_SEARCH_EMAIL: /(\w+)\.email\.toLowerCase\(\)\.includes/g,
  UNSAFE_SEARCH_PHONE: /(\w+)\.phone\.toLowerCase\(\)\.includes/g
};

/**
 * Generate safe replacements for common patterns
 */
export function generateSafeReplacements(unsafeCode: string): string {
  let safeCode = unsafeCode;
  
  // Replace direct field access
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_EMAIL, 'getSafeUserEmail($1)');
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_PHONE, 'getSafeUserPhone($1)');
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_DISPLAY_NAME, 'getSafeUserDisplayName($1)');
  
  // Replace JSX field display
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_JSX_EMAIL, '{getSafeDisplayEmail($1)}');
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_JSX_PHONE, '{getSafeDisplayPhone($1)}');
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_JSX_DISPLAY_NAME, '{getSafeUserDisplayName($1)}');
  
  // Replace nested user field access
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_USER_EMAIL, 'getSafeUserEmail($1.user)');
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_USER_PHONE, 'getSafeUserPhone($1.user)');
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_USER_DISPLAY_NAME, 'getSafeUserDisplayName($1.user)');
  
  // Replace search patterns
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_SEARCH_EMAIL, '(getSafeUserEmail($1) && getSafeUserEmail($1).toLowerCase().includes');
  safeCode = safeCode.replace(PROFILE_ACCESS_PATTERNS.UNSAFE_SEARCH_PHONE, '(getSafeUserPhone($1) && getSafeUserPhone($1).toLowerCase().includes');
  
  return safeCode;
}

// =====================================================================================
// COMPONENT WRAPPER FOR LEGACY COMPONENTS
// =====================================================================================

import React from 'react';

/**
 * HOC to add safe profile access to legacy components
 */
export function withSafeProfileAccess<T extends {}>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function SafeProfileWrapper(props: T) {
    // Add safe profile utilities to props
    const enhancedProps = {
      ...props,
      getSafeUserEmail,
      getSafeUserPhone,
      getSafeUserDisplayName,
      getSafeDisplayEmail,
      getSafeDisplayPhone,
      hasValidEmail,
      hasValidPhone,
      safeProfileSearchFilter
    };
    
    return React.createElement(Component, enhancedProps);
  };
}

// =====================================================================================
// BACKWARDS COMPATIBILITY
// =====================================================================================

// Export old function names for backwards compatibility
export {
  getSafeUserEmail as getSafeEmail,
  getSafeDisplayEmail as getSafeDisplayEmailOld,
  getSafeUserDisplayName as getSafeDisplayName,
  hasValidEmail as hasEmail,
  safeProfileSearchFilter as safeEmailSearchFilter
};

export default {
  getSafeUserEmail,
  getSafeUserPhone,
  getSafeUserDisplayName,
  getSafeUserOrganization,
  getSafeUserJobTitle,
  getSafeProfileField,
  getSafeDisplayEmail,
  getSafeDisplayPhone,
  getSafeDisplayOrganization,
  hasValidEmail,
  hasValidPhone,
  hasValidDisplayName,
  safeProfileSearchFilter,
  makeSafeTeamMember,
  makeSafeUser,
  useSafeTeamMembers,
  useSafeUsers,
  useSafeUserSearch,
  withSafeProfileAccess,
  generateSafeReplacements
};