// File: src/hooks/useComplianceRequirements.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ComplianceRequirementsService, UIRequirement, SubmissionData } from '@/services/compliance/complianceRequirementsService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useUIRequirements(userId: string, role: string, tier: string) {
  return useQuery({
    queryKey: ['ui-requirements', userId, role, tier],
    queryFn: () => ComplianceRequirementsService.getUIRequirements(userId, role, tier),
    enabled: !!userId && !!role && !!tier,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('Error fetching requirements:', error);
      toast.error('Failed to load compliance requirements');
    },
  });
}

export function useRequirementSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      requirementId, 
      submissionData 
    }: { 
      userId: string; 
      requirementId: string; 
      submissionData: SubmissionData;
    }) => {
      return ComplianceRequirementsService.submitRequirement(userId, requirementId, submissionData);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries(['ui-requirements', variables.userId]);
      queryClient.invalidateQueries(['compliance-tier', variables.userId]);
      queryClient.invalidateQueries(['compliance-progress', variables.userId]);
      
      if (data.autoApproved) {
        toast.success('Requirement automatically approved!');
      } else {
        toast.success('Requirement submitted successfully');
      }
    },
    onError: (error: any) => {
      console.error('Submission error:', error);
      toast.error('Failed to submit requirement. Please try again.');
    },
  });
}

export function useRequirementUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      requirementId, 
      status,
      additionalData
    }: { 
      userId: string; 
      requirementId: string; 
      status: string;
      additionalData?: any;
    }) => {
      return ComplianceRequirementsService.updateRequirementStatus(
        userId, 
        requirementId, 
        status, 
        additionalData
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['ui-requirements', variables.userId]);
      queryClient.invalidateQueries(['compliance-progress', variables.userId]);
      
      toast.success('Requirement updated successfully');
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('Failed to update requirement. Please try again.');
    },
  });
}

export function useRequirementsByCategory(role: string, tier: string) {
  return useQuery({
    queryKey: ['requirements-by-category', role, tier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select(`
          *,
          compliance_templates!inner(role, tier)
        `)
        .eq('compliance_templates.role', role)
        .eq('compliance_templates.tier', tier)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      // Group by category
      const grouped = data.reduce((acc, req) => {
        const category = req.category || 'General';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(req);
        return acc;
      }, {} as Record<string, any[]>);
      
      return grouped;
    },
    enabled: !!role && !!tier,
    staleTime: 300000, // 5 minutes
  });
}

export function useBulkRequirementUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId,
      requirementIds, 
      updates 
    }: { 
      userId: string;
      requirementIds: string[]; 
      updates: Record<string, any>;
    }) => {
      // Bulk update implementation
      const { error } = await supabase
        .from('user_compliance_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('requirement_id', requirementIds);
      
      if (error) throw error;
      
      return { success: true, updated: requirementIds.length };
    },
    onSuccess: (data, variables) => {
      // Invalidate all requirement-related queries
      queryClient.invalidateQueries(['ui-requirements', variables.userId]);
      queryClient.invalidateQueries(['compliance-progress', variables.userId]);
      
      toast.success('Bulk update completed successfully');
    },
    onError: (error: any) => {
      console.error('Bulk update error:', error);
      toast.error('Failed to perform bulk update. Please try again.');
    },
  });
}

// Hook for requirement review (admin functionality)
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
      reviewData: any;
    }) => {
      // Implementation would call ComplianceService.reviewSubmission
      const { data, error } = await supabase
        .from('user_compliance_records')
        .update({
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          review_notes: reviewData.notes,
          review_data: reviewData.metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select(`
          *,
          profiles!user_id(id, display_name, email)
        `)
        .single();
      
      if (error) throw error;
      
      return { record: data };
    },
    onSuccess: (data, variables) => {
      // Get user ID from the record returned
      const userId = data.record.user_id;
      
      queryClient.invalidateQueries(['ui-requirements', userId]);
      queryClient.invalidateQueries(['compliance-progress', userId]);
      queryClient.invalidateQueries(['submissions-to-review']);
      
      toast.success(
        variables.decision === 'approve'
          ? 'Requirement approved successfully'
          : 'Requirement returned for revision'
      );
    },
    onError: (error: any) => {
      console.error('Review error:', error);
      toast.error('Failed to submit review. Please try again.');
    },
  });
}

// Hook for getting submissions that need review
export function useSubmissionsToReview(filters: any, reviewerRole: string) {
  return useQuery({
    queryKey: ['submissions-to-review', filters, reviewerRole],
    queryFn: async () => {
      let query = supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_requirements!inner(
            id,
            name,
            requirement_type,
            category
          ),
          profiles!user_id!inner(
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('status', 'submitted');
      
      // Apply filters
      if (filters.requirementType && filters.requirementType !== 'all') {
        query = query.eq('compliance_requirements.requirement_type', filters.requirementType);
      }
      
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }
        
        if (startDate) {
          query = query.gte('submitted_at', startDate.toISOString());
        }
      }
      
      const { data, error } = await query
        .order('submitted_at', { ascending: true });
      
      if (error) throw error;
      
      return data?.map(record => ({
        id: record.id,
        requirement_id: record.requirement_id,
        requirement_name: record.compliance_requirements.name,
        requirement_type: record.compliance_requirements.requirement_type,
        user_id: record.user_id,
        user_name: record.profiles.display_name,
        user_email: record.profiles.email,
        user_role: record.profiles.role,
        status: record.status,
        submitted_at: record.submitted_at,
        submission_data: record.submission_data,
        files: record.submission_data?.files || [],
        notes: record.submission_data?.notes
      })) || [];
    },
    enabled: !!reviewerRole,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}