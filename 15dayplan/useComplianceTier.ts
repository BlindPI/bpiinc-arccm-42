// File: src/hooks/useComplianceTier.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ComplianceTierService, UIComplianceTierInfo } from '@/services/compliance/complianceTierService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useComplianceTier(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['compliance-tier', targetUserId],
    queryFn: () => ComplianceTierService.getUIComplianceTierInfo(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('Error fetching compliance tier:', error);
    },
  });
}

export function useComplianceTierRealtime(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;
  
  useEffect(() => {
    if (!targetUserId) return;
    
    const subscription = ComplianceTierService.subscribeToTierChanges(
      targetUserId,
      (update: UIComplianceTierInfo) => {
        // Update React Query cache with new data
        queryClient.setQueryData(['compliance-tier', targetUserId], update);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [targetUserId, queryClient]);
  
  return useComplianceTier(targetUserId);
}

export function useComplianceTierComparison(role: string) {
  return useQuery({
    queryKey: ['tier-comparison', role],
    queryFn: async () => {
      // Fetch both tiers for comparison
      const { data, error } = await supabase
        .from('compliance_templates')
        .select('*')
        .eq('role', role)
        .order('tier');
      
      if (error) throw error;
      
      const basic = data.find(t => t.tier === 'basic');
      const robust = data.find(t => t.tier === 'robust');
      
      return { basic, robust };
    },
    enabled: !!role,
    staleTime: 300000, // 5 minutes - template data changes rarely
  });
}

export function useTierSwitchValidation(userId: string, targetTier: string) {
  return useQuery({
    queryKey: ['tier-switch-validation', userId, targetTier],
    queryFn: async () => {
      // Get current user info
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, compliance_tier')
        .eq('id', userId)
        .single();
      
      if (!profile) throw new Error('User not found');
      
      // Validate tier switch
      const validation = {
        allowed: true,
        reason: '',
        impact: {
          requirementsToAdd: 0,
          requirementsToRemove: 0,
          requirementsToPreserve: 0,
          estimatedTimeToComplete: ''
        }
      };
      
      // Role-specific restrictions
      if (profile.role === 'IC' && targetTier === 'basic') {
        validation.allowed = false;
        validation.reason = 'Certified instructors must maintain comprehensive tier';
      }
      
      // Get current tier info for impact analysis
      if (validation.allowed) {
        const tierInfo = await ComplianceTierService.getUserTierInfo(userId);
        
        if (profile.role === 'IT' && targetTier === 'robust' && tierInfo.completion_percentage < 80) {
          validation.allowed = false;
          validation.reason = `Need ${80 - tierInfo.completion_percentage}% more completion to advance`;
        }
        
        // Calculate impact
        const { data: targetRequirements } = await supabase
          .from('compliance_requirements')
          .select('id, compliance_templates!inner(role, tier)')
          .eq('compliance_templates.role', profile.role)
          .eq('compliance_templates.tier', targetTier);
        
        validation.impact.requirementsToAdd = targetRequirements?.length || 0;
        validation.impact.estimatedTimeToComplete = targetTier === 'robust' ? '6-12 weeks' : '2-4 weeks';
      }
      
      return validation;
    },
    enabled: !!userId && !!targetTier,
    staleTime: 60000 // 1 minute
  });
}