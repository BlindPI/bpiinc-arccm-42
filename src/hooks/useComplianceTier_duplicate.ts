import { useState, useEffect } from 'react';
import { ComplianceTierService } from '../services/compliance/complianceTierService';

export interface TierInfo {
  tier: 'basic' | 'robust';
  role: string;
  template_name?: string;
  description?: string;
  completion_percentage: number;
  completed_requirements: number;
  requirements_count: number;
  can_advance_tier: boolean;
  advancement_blocked_reason?: string;
  last_updated: string;
  next_requirement?: {
    id: string;
    name: string;
    due_date?: string;
  };
}

export interface TierSwitchValidation {
  allowed: boolean;
  reason?: string;
  impact?: {
    requirementsToAdd: number;
    requirementsToRemove: number;
    requirementsToPreserve: number;
    estimatedTimeToComplete: string;
  };
}

/**
 * Hook to get user's current compliance tier information
 */
export function useComplianceTier(userId?: string) {
  const [data, setData] = useState<TierInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTierInfo = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const tierInfo = await ComplianceTierService.getUserTierInfo(userId);
        setData(tierInfo);
        setError(null);
      } catch (err) {
        console.error('Error fetching tier info:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTierInfo();
  }, [userId]);

  return { data, isLoading, error };
}

/**
 * Hook to validate tier switch possibility
 */
export function useTierSwitchValidation(userId: string, targetTier: string) {
  const [data, setData] = useState<TierSwitchValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const validateTierSwitch = async () => {
      if (!userId || !targetTier) return;
      
      try {
        setIsLoading(true);
        const validation = await ComplianceTierService.validateTierSwitch(userId, targetTier);
        setData(validation);
        setError(null);
      } catch (err) {
        console.error('Error validating tier switch:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    validateTierSwitch();
  }, [userId, targetTier]);

  return { data, isLoading, error };
}

/**
 * Hook to get tier comparison data for a specific role
 */
export function useComplianceTierComparison(role: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTierComparisonData = async () => {
      if (!role) return;
      
      try {
        setIsLoading(true);
        const comparisonData = await ComplianceTierService.getTierComparisonData(role);
        setData(comparisonData);
        setError(null);
      } catch (err) {
        console.error('Error fetching tier comparison data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTierComparisonData();
  }, [role]);

  return { data, isLoading, error };
}