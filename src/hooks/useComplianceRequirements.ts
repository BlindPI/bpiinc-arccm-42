// File: src/hooks/useComplianceRequirements.ts

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['compliance-requirements', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Use the actual existing service method
      const { data, error } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_metrics(*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!userId
  });
}

/**
 * Hook to fetch requirements filtered by role
 * @param userId - The user ID
 * @param role - The user's role (IT, IC, IP, AP)
 * @returns Query result with role-specific requirements
 */
export function useRoleRequirements(userId: string, role: string) {
  return useQuery({
    queryKey: ['role-requirements', userId, role],
    queryFn: async () => {
      const requirements = await ComplianceRequirementsService.getUserRequirements(userId);
      return requirements.filter(req =>
        req.assigned_roles.includes(role)
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!userId && !!role
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
  
  return useQuery({
    queryKey: ['ui-requirements', userId, role],
    queryFn: async () => {
      const requirements = await ComplianceRequirementsService.getUserRequirements(userId);
      
      // Filter by role and enhance with UI properties
      return requirements
        .filter(req => req.assigned_roles.includes(role))
        .map(req => enhanceRequirementForUI(req));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!userId && !!role
  });
}

/**
 * Hook to fetch a single requirement by ID
 * @param requirementId - The requirement ID
 * @returns Query result with single requirement
 */
export function useRequirement(requirementId: string) {
  return useQuery({
    queryKey: ['requirement', requirementId],
    queryFn: () => ComplianceRequirementsService.getRequirementById(requirementId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!requirementId // Only run query if requirementId exists
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

/**
 * Hook for SA/AD/AP to fetch submissions awaiting review
 * @param filters - Filter criteria for submissions
 * @param userRole - Current user's role for permission checking
 * @returns Query result with submissions to review
 */
export function useSubmissionsToReview(
  filters: { requirementType: string; dateRange: string },
  userRole?: string
) {
  return useQuery({
    queryKey: ['submissions-to-review', filters, userRole],
    queryFn: async () => {
      // Only SA/AD/AP can access review queue
      if (!userRole || !['SA', 'AD', 'AP'].includes(userRole)) {
        throw new Error('Insufficient permissions to access review queue');
      }

      console.log('🔍 DEBUG: Querying submissions for review with filters:', filters);
      
      const { data, error } = await supabase
        .from('user_compliance_records')
        .select(`
          id,
          user_id,
          metric_id,
          compliance_status,
          current_value,
          last_checked_at,
          notes,
          compliance_metrics!inner(
            name,
            category,
            measurement_type
          ),
          profiles!user_id(
            display_name,
            email,
            role
          )
        `)
        .eq('compliance_status', 'submitted')
        .order('last_checked_at', { ascending: true });

      if (error) {
        console.error('🚨 DEBUG: Database query error:', error);
        throw error;
      }

      console.log('✅ DEBUG: Query successful, got', data?.length, 'records');

      if (error) throw error;

      // Apply filters
      let filteredData = data || [];

      if (filters.requirementType !== 'all') {
        filteredData = filteredData.filter(
          record => record.compliance_metrics.measurement_type === filters.requirementType
        );
      }

      if (filters.dateRange !== 'all') {
        const now = new Date();
        let cutoffDate = new Date();

        switch (filters.dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        }

        filteredData = filteredData.filter(
          record => new Date(record.last_checked_at) >= cutoffDate
        );
      }

      // Format for UI display
      return filteredData.map(record => ({
        id: record.id,
        user_id: record.user_id,
        user_name: record.profiles.display_name || record.profiles.email || 'Unknown User',
        user_email: record.profiles.email,
        user_role: record.profiles.role,
        requirement_id: record.metric_id,
        requirement_name: record.compliance_metrics.name,
        requirement_type: record.compliance_metrics.measurement_type,
        category: record.compliance_metrics.category,
        status: record.compliance_status,
        submitted_at: record.last_checked_at,
        notes: record.notes,
        files: (record.current_value as any)?.files || [],
        submission_data: record.current_value
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - fresh data for admin functions
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!userRole && ['SA', 'AD', 'AP'].includes(userRole)
  });
}

/**
 * Hook for reviewing and approving/rejecting requirement submissions
 * @returns Mutation function for review operations
 */
export function useRequirementReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      reviewerId,
      decision,
      reviewData
    }: {
      submissionId: string;
      reviewerId: string;
      decision: 'approve' | 'reject';
      reviewData: {
        notes: string;
        metadata?: any;
      };
    }) => {
      const newStatus = decision === 'approve' ? 'approved' : 'rejected';
      
      // Update the compliance record
      const { data: updatedRecord, error: updateError } = await supabase
        .from('user_compliance_records')
        .update({
          compliance_status: newStatus,
          review_notes: reviewData.notes,
          reviewed_at: new Date().toISOString(),
          approved_by: reviewerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select(`
          *,
          profiles!user_id(display_name, email),
          compliance_metrics!inner(name)
        `)
        .single();

      if (updateError) throw updateError;

      // Log the review activity
      await supabase
        .from('compliance_audit_log')
        .insert({
          user_id: updatedRecord.user_id,
          performed_by: reviewerId,
          audit_type: `requirement_${decision}d`,
          metric_id: updatedRecord.metric_id,
          notes: reviewData.notes,
          created_at: new Date().toISOString()
        });

      return updatedRecord;
    },
    onSuccess: () => {
      // Invalidate and refetch submissions queue
      queryClient.invalidateQueries({ queryKey: ['submissions-to-review'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-progress'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-activity'] });
    }
  });
}

/**
 * Hook to fetch compliance progress data for dashboard
 * @param userId - User ID to get progress for
 * @returns Query result with progress statistics
 */
export function useComplianceProgress(userId: string) {
  return useQuery({
    queryKey: ['compliance-progress', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required for progress data');

      // Get user's compliance records with requirement details
      const { data: records, error } = await supabase
        .from('user_compliance_records')
        .select(`
          id,
          status,
          submitted_at,
          reviewed_at,
          compliance_requirements!inner(
            requirement_type,
            points_value,
            category
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const allRecords = records || [];
      
      // Calculate completion statistics
      const completion = {
        total: allRecords.length,
        completed: allRecords.filter(r => r.compliance_status === 'approved').length,
        inProgress: allRecords.filter(r => r.compliance_status === 'submitted' || r.compliance_status === 'in_progress').length,
        pending: allRecords.filter(r => r.compliance_status === 'pending').length,
        rejected: allRecords.filter(r => r.compliance_status === 'rejected').length,
        percentage: 0
      };

      completion.percentage = completion.total > 0
        ? Math.round((completion.completed / completion.total) * 100)
        : 0;

      // Calculate points
      const totalPoints = allRecords.reduce((sum, r) => sum + (r.compliance_metrics.points_value || 0), 0);
      const earnedPoints = allRecords
        .filter(r => r.compliance_status === 'approved')
        .reduce((sum, r) => sum + (r.compliance_metrics.points_value || 0), 0);

      const points = {
        total: totalPoints,
        earned: earnedPoints,
        percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
      };

      // Group by requirement type
      const byType = allRecords.reduce((acc, record) => {
        const type = record.compliance_metrics.measurement_type || 'other';
        if (!acc[type]) {
          acc[type] = { total: 0, completed: 0 };
        }
        acc[type].total++;
        if (record.compliance_status === 'approved') {
          acc[type].completed++;
        }
        return acc;
      }, {} as Record<string, { total: number; completed: number }>);

      return {
        completion,
        points,
        byType,
        lastUpdated: new Date().toISOString()
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!userId
  });
}

/**
 * Hook to fetch recent compliance activity
 * @param userId - User ID to get activity for
 * @param limit - Maximum number of activities to return
 * @returns Query result with recent activities
 */
export function useComplianceActivity(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: ['compliance-activity', userId, limit],
    queryFn: async () => {
      if (!userId) return [];

      const { data: activities, error } = await supabase
        .from('compliance_activity_log')
        .select(`
          id,
          action,
          requirement_id,
          metadata,
          created_at,
          compliance_requirements(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Format activities for UI display
      return (activities || []).map(activity => ({
        id: activity.id,
        action: activity.action,
        requirementId: activity.requirement_id,
        requirementName: activity.compliance_requirements?.name,
        timestamp: activity.created_at,
        metadata: activity.metadata
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - activity should be relatively fresh
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!userId
  });
}