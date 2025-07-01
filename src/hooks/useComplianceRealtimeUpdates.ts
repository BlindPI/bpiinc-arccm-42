// File: src/hooks/useComplianceRealtimeUpdates.ts

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useComplianceRealtimeUpdates(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;
  
  useEffect(() => {
    if (!targetUserId) return;
    
    // Subscribe to compliance record changes
    const complianceChannel = supabase
      .channel(`compliance-updates-${targetUserId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${targetUserId}`
      }, (payload) => {
        console.log('Compliance record update:', payload);
        
        // Invalidate requirement queries
        queryClient.invalidateQueries({ queryKey: ['ui-requirements', targetUserId] });
        queryClient.invalidateQueries({ queryKey: ['compliance-progress', targetUserId] });
        queryClient.invalidateQueries({ queryKey: ['compliance-activity', targetUserId] });
        
        // Update specific requirement in cache if possible
        if (payload.eventType === 'UPDATE' && payload.new) {
          const requirementId = payload.new.requirement_id;
          const status = payload.new.status;
          
          // Update cached requirements with new status
          queryClient.setQueriesData(
            { queryKey: ['ui-requirements', targetUserId] },
            (oldData: any) => {
              if (!oldData) return oldData;
              
              return oldData.map((req: any) =>
                req.id === requirementId
                  ? { ...req, status, progress: calculateProgressFromStatus(status) }
                  : req
              );
            }
          );
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${targetUserId}`
      }, (payload) => {
        console.log('Profile update:', payload);
        
        // Invalidate tier-related queries
        queryClient.invalidateQueries({ queryKey: ['compliance-tier', targetUserId] });
        
        // If tier changed, invalidate requirements too
        if (payload.eventType === 'UPDATE' &&
            payload.old?.compliance_tier !== payload.new?.compliance_tier) {
          queryClient.invalidateQueries({ queryKey: ['ui-requirements', targetUserId] });
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_tier_history',
        filter: `user_id=eq.${targetUserId}`
      }, (payload) => {
        console.log('Tier history update:', payload);
        
        // Invalidate tier queries
        queryClient.invalidateQueries({ queryKey: ['compliance-tier', targetUserId] });
        queryClient.invalidateQueries({ queryKey: ['tier-history', targetUserId] });
      })
      .subscribe();
    
    // Subscribe to activity log changes
    const activityChannel = supabase
      .channel(`activity-updates-${targetUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'compliance_activity_log',
        filter: `user_id=eq.${targetUserId}`
      }, (payload) => {
        console.log('New activity:', payload);
        
        // Invalidate activity queries
        queryClient.invalidateQueries({ queryKey: ['compliance-activity', targetUserId] });
        
        // Show toast notification for important activities
        if (payload.new?.action === 'requirement_approved') {
          // Toast would be shown by the component using this hook
        }
      })
      .subscribe();
    
    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(complianceChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [targetUserId, queryClient]);
}

export function useGlobalComplianceUpdates() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Subscribe to global compliance template changes
    const templatesChannel = supabase
      .channel('global-compliance-templates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_templates'
      }, (payload) => {
        console.log('Template update:', payload);
        
        // Invalidate template-related queries
        queryClient.invalidateQueries({ queryKey: ['tier-comparison'] });
        queryClient.invalidateQueries({ queryKey: ['compliance-templates'] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_requirements'
      }, (payload) => {
        console.log('Requirement definition update:', payload);
        
        // Invalidate requirement-related queries
        queryClient.invalidateQueries({ queryKey: ['requirements-by-category'] });
        queryClient.invalidateQueries({ queryKey: ['ui-requirements'] });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(templatesChannel);
    };
  }, [queryClient]);
}

// Hook for specific table updates with custom handling
export function useTableUpdates(
  tableName: string, 
  filter?: string, 
  onUpdate?: (payload: any) => void
) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}-updates-${Math.random()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: tableName,
        ...(filter ? { filter } : {})
      }, (payload) => {
        console.log(`${tableName} update:`, payload);
        
        if (onUpdate) {
          onUpdate(payload);
        } else {
          // Default behavior: invalidate queries related to this table
          queryClient.invalidateQueries({ queryKey: [tableName] });
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, filter, onUpdate, queryClient]);
}

// Hook for monitoring review queue updates (for administrators)
export function useReviewQueueUpdates(reviewerRole: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!reviewerRole) return;
    
    const reviewChannel = supabase
      .channel(`review-queue-updates-${reviewerRole}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_compliance_records',
        filter: 'status=eq.submitted'
      }, (payload) => {
        console.log('Review queue update:', payload);
        
        // Invalidate submissions to review
        queryClient.invalidateQueries({ queryKey: ['submissions-to-review'] });
        queryClient.invalidateQueries({ queryKey: ['reviewer-stats'] });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(reviewChannel);
    };
  }, [reviewerRole, queryClient]);
}

// Helper function
function calculateProgressFromStatus(status: string): number {
  switch (status) {
    case 'approved': return 100;
    case 'submitted': return 80;
    case 'in_progress': return 50;
    case 'rejected': return 25;
    default: return 0;
  }
}