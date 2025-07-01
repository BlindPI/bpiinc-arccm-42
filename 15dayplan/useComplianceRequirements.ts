// File: src/hooks/useComplianceRequirements.ts

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';

// Define the requirement interface 
export interface Requirement {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'basic' | 'robust';
  status: 'pending' | 'in_progress' | 'completed' | 'waived';
  due_date?: string;
  completion_date?: string;
  type: 'form' | 'upload' | 'external' | 'mixed';
  assigned_roles: string[];
  metadata?: Record<string, any>;
}

export interface UIRequirement extends Requirement {
  // UI-specific properties
  isOverdue?: boolean;
  completionPercentage?: number;
  isVisible?: boolean;
}

/**
 * Hook to fetch all compliance requirements
 * @param userId - The user ID
 * @returns Query result with requirements data
 */
export function useComplianceRequirements(userId: string) {
  return useQuery(
    ['compliance-requirements', userId],
    () => ComplianceRequirementsService.getUserRequirements(userId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 2,
      enabled: !!userId
    }
  );
}

/**
 * Hook to fetch requirements filtered by role
 * @param userId - The user ID
 * @param role - The user's role (IT, IC, IP, AP)
 * @returns Query result with role-specific requirements
 */
export function useRoleRequirements(userId: string, role: string) {
  return useQuery(
    ['role-requirements', userId, role],
    async () => {
      const requirements = await ComplianceRequirementsService.getUserRequirements(userId);
      return requirements.filter(req => 
        req.assigned_roles.includes(role)
      );
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 2,
      enabled: !!userId && !!role
    }
  );
}

/**
 * Hook to fetch requirements with UI enhancements
 * @param userId - The user ID
 * @param role - The user's role (IT, IC, IP, AP)
 * @returns Query result with enhanced UI requirements
 */
export function useUIRequirements(userId: string, role: string) {
  const queryClient = useQueryClient();
  
  return useQuery(
    ['ui-requirements', userId, role],
    async () => {
      const requirements = await ComplianceRequirementsService.getUserRequirements(userId);
      
      // Filter by role and enhance with UI properties
      return requirements
        .filter(req => req.assigned_roles.includes(role))
        .map(req => enhanceRequirementForUI(req));
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 2,
      enabled: !!userId && !!role,
      onSuccess: (data) => {
        // Cache individual requirements for quick access
        data.forEach(req => {
          queryClient.setQueryData(
            ['requirement', req.id],
            req
          );
        });
      }
    }
  );
}

/**
 * Hook to fetch a single requirement by ID
 * @param requirementId - The requirement ID
 * @returns Query result with single requirement
 */
export function useRequirement(requirementId: string) {
  return useQuery(
    ['requirement', requirementId],
    () => ComplianceRequirementsService.getRequirementById(requirementId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!requirementId, // Only run query if requirementId exists
    }
  );
}

/**
 * Adds UI-specific properties to a requirement
 * @param requirement - The base requirement
 * @returns Enhanced requirement with UI properties
 */
function enhanceRequirementForUI(requirement: Requirement): UIRequirement {
  const today = new Date();
  const dueDate = requirement.due_date ? new Date(requirement.due_date) : null;
  
  // Calculate if requirement is overdue
  const isOverdue = dueDate ? 
    (today > dueDate && requirement.status !== 'completed' && requirement.status !== 'waived') : 
    false;
  
  // Calculate completion percentage based on status
  let completionPercentage = 0;
  switch (requirement.status) {
    case 'pending':
      completionPercentage = 0;
      break;
    case 'in_progress':
      completionPercentage = 50;
      break;
    case 'completed':
    case 'waived':
      completionPercentage = 100;
      break;
  }
  
  // Add UI properties
  return {
    ...requirement,
    isOverdue,
    completionPercentage,
    isVisible: true
  };
}

/**
 * Custom hook to provide categorized requirements
 * @param userId - The user ID
 * @param role - The user's role
 * @returns Object with requirements grouped by category
 */
export function useCategorizedRequirements(userId: string, role: string) {
  const { data, isLoading, error } = useUIRequirements(userId, role);
  const [categorized, setCategorized] = useState<Record<string, UIRequirement[]>>({});
  
  useEffect(() => {
    if (data) {
      // Group requirements by category
      const grouped = data.reduce((acc, req) => {
        if (!acc[req.category]) {
          acc[req.category] = [];
        }
        acc[req.category].push(req);
        return acc;
      }, {} as Record<string, UIRequirement[]>);
      
      setCategorized(grouped);
    }
  }, [data]);
  
  return { categorized, isLoading, error };
}

/**
 * Hook to fetch upcoming requirement deadlines
 * @param userId - The user ID
 * @param role - The user's role
 * @param limit - Maximum number of upcoming requirements to return
 * @returns Array of upcoming requirements sorted by due date
 */
export function useUpcomingRequirements(userId: string, role: string, limit: number = 5) {
  const { data, isLoading, error } = useUIRequirements(userId, role);
  
  const upcomingRequirements = data
    ? data
        .filter(req => 
          req.due_date && 
          req.status !== 'completed' && 
          req.status !== 'waived'
        )
        .sort((a, b) => {
          if (!a.due_date || !b.due_date) return 0;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        })
        .slice(0, limit)
    : [];
  
  return { 
    upcomingRequirements, 
    isLoading, 
    error 
  };
}

/**
 * Hook to get requirement completion statistics
 * @param userId - The user ID
 * @param role - The user's role
 * @returns Object with completion statistics
 */
export function useRequirementStats(userId: string, role: string) {
  const { data, isLoading, error } = useUIRequirements(userId, role);
  
  const stats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    completionPercentage: 0
  };
  
  if (data) {
    stats.total = data.length;
    stats.completed = data.filter(req => req.status === 'completed' || req.status === 'waived').length;
    stats.inProgress = data.filter(req => req.status === 'in_progress').length;
    stats.pending = data.filter(req => req.status === 'pending').length;
    stats.overdue = data.filter(req => req.isOverdue).length;
    stats.completionPercentage = stats.total > 0 
      ? Math.round((stats.completed / stats.total) * 100) 
      : 0;
  }
  
  return { stats, isLoading, error };
}