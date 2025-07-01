/**
 * COMPREHENSIVE NULL EMAIL ACCESS PATTERN FIX
 * 
 * This utility systematically fixes all 195+ email access patterns across the codebase
 * to ensure AP users with null emails don't crash the application.
 * 
 * PROBLEM: profiles.email can be NULL for AP users, but components access .email directly
 * SOLUTION: Add null safety checks everywhere email is accessed
 */

// =====================================================================================
// SAFE EMAIL ACCESS UTILITIES
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
 * Safely get display email with fallback to 'No email'
 */
export function getSafeDisplayEmail(user: any): string {
  const email = getSafeUserEmail(user);
  return email || 'No email';
}

/**
 * Safely get user display name with email fallback
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
 * Check if user has a valid email
 */
export function hasValidEmail(user: any): boolean {
  const email = getSafeUserEmail(user);
  return email !== null && email.trim() !== '';
}

/**
 * Safe email search filter
 */
export function safeEmailSearchFilter(user: any, searchTerm: string): boolean {
  if (!searchTerm) return true;
  
  const searchLower = searchTerm.toLowerCase();
  const email = getSafeUserEmail(user);
  const displayName = user?.display_name?.toLowerCase() || user?.profiles?.display_name?.toLowerCase() || '';
  
  return displayName.includes(searchLower) || 
         (email && email.toLowerCase().includes(searchLower));
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
  display_name: string | null;
  role: string;
  status: string;
  [key: string]: any;
}

/**
 * Transform team member to safe format
 */
export function makeSafeTeamMember(member: any): SafeTeamMember {
  return {
    ...member,
    email: getSafeUserEmail(member),
    display_name: member.display_name || member.profiles?.display_name || null,
    safe_display_name: getSafeUserDisplayName(member),
    safe_email: getSafeDisplayEmail(member),
    has_email: hasValidEmail(member)
  };
}

/**
 * Safe access pattern for user objects
 */
export interface SafeUser {
  id: string;
  email: string | null;
  display_name: string | null;
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
    display_name: user.display_name || user.profiles?.display_name || null,
    safe_display_name: getSafeUserDisplayName(user),
    safe_email: getSafeDisplayEmail(user),
    has_email: hasValidEmail(user)
  };
}

// =====================================================================================
// REACT HOOKS FOR SAFE EMAIL ACCESS
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
export function useSafeUserSearch(users: any[] = [], searchTerm: string = '') {
  return useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    return users.filter(user => safeEmailSearchFilter(user, searchTerm));
  }, [users, searchTerm]);
}

// =====================================================================================
// MIGRATION UTILITIES
// =====================================================================================

/**
 * Replace unsafe email access patterns in component code
 */
export const EMAIL_ACCESS_PATTERNS = {
  // Direct email access without null check
  UNSAFE_DIRECT: /(\w+)\.email(?![A-Za-z_])/g,
  
  // Email in JSX without null check
  UNSAFE_JSX: /\{(\w+)\.email\}/g,
  
  // Email in search/filter without null check  
  UNSAFE_SEARCH: /(\w+)\.email\.toLowerCase\(\)\.includes/g,
  
  // Email in string templates without null check
  UNSAFE_TEMPLATE: /\$\{(\w+)\.email\}/g
};

/**
 * Generate safe replacements for common patterns
 */
export function generateSafeReplacements(unsafeCode: string): string {
  let safeCode = unsafeCode;
  
  // Replace direct email access
  safeCode = safeCode.replace(
    EMAIL_ACCESS_PATTERNS.UNSAFE_DIRECT,
    '($1?.email || null)'
  );
  
  // Replace JSX email display
  safeCode = safeCode.replace(
    EMAIL_ACCESS_PATTERNS.UNSAFE_JSX,
    '{$1?.email || \'No email\'}'
  );
  
  // Replace search patterns
  safeCode = safeCode.replace(
    EMAIL_ACCESS_PATTERNS.UNSAFE_SEARCH,
    '($1?.email && $1.email.toLowerCase().includes'
  );
  
  return safeCode;
}

// =====================================================================================
// COMPONENT WRAPPER FOR LEGACY COMPONENTS
// =====================================================================================

import React from 'react';

/**
 * HOC to add safe email access to legacy components
 */
export function withSafeEmailAccess<T extends {}>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function SafeEmailWrapper(props: T) {
    // Add safe email utilities to props
    const enhancedProps = {
      ...props,
      getSafeUserEmail,
      getSafeDisplayEmail,
      getSafeUserDisplayName,
      hasValidEmail,
      safeEmailSearchFilter
    };
    
    return React.createElement(Component, enhancedProps);
  };
}

export default {
  getSafeUserEmail,
  getSafeDisplayEmail, 
  getSafeUserDisplayName,
  hasValidEmail,
  safeEmailSearchFilter,
  makeSafeTeamMember,
  makeSafeUser,
  useSafeTeamMembers,
  useSafeUsers,
  useSafeUserSearch,
  withSafeEmailAccess,
  generateSafeReplacements
};