// File: src/contexts/DashboardContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';

// Define the interfaces for our dashboard context
export interface UIComplianceTierInfo {
  id: string;
  userId: string;
  tier: 'basic' | 'robust';
  completion_percentage: number;
  can_advance_tier: boolean;
  next_requirement?: {
    id: string;
    name: string;
    due_date: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UIRequirement {
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
  
  // UI-specific properties
  isOverdue?: boolean;
  completionPercentage?: number;
  isVisible?: boolean;
}

// Define the shape of our dashboard context
interface DashboardContextValue {
  userId: string;
  role: string;
  tierInfo: UIComplianceTierInfo | null;
  requirements: UIRequirement[];
  isLoading: boolean;
  error: Error | null;
  
  // Additional dashboard context methods
  refreshData: () => Promise<void>;
  filterRequirements: (status?: string, category?: string) => UIRequirement[];
  getCategoryCompletionPercentage: (category: string) => number;
}

// Create the context with a default undefined value
const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

// Provider props interface
interface DashboardContextProviderProps {
  userId: string;
  role: string;
  tierInfo: UIComplianceTierInfo | null;
  requirements: UIRequirement[];
  isLoading: boolean;
  error: Error | null;
  children: ReactNode;
}

/**
 * Provider component for the Dashboard context
 * This provides dashboard data and utility functions to all child components
 */
export function DashboardContextProvider({
  userId,
  role,
  tierInfo,
  requirements = [],
  isLoading = false,
  error = null,
  children
}: DashboardContextProviderProps) {
  // Method to refresh dashboard data
  const refreshData = async (): Promise<void> => {
    // This would typically call the actual data fetching functions
    console.log('Refreshing dashboard data for user:', userId);
    return Promise.resolve();
  };
  
  // Filter requirements by status and/or category
  const filterRequirements = (status?: string, category?: string): UIRequirement[] => {
    return requirements.filter(req => {
      const statusMatch = !status || req.status === status;
      const categoryMatch = !category || req.category === category;
      return statusMatch && categoryMatch;
    });
  };
  
  // Calculate completion percentage for a specific category
  const getCategoryCompletionPercentage = (category: string): number => {
    const categoryReqs = requirements.filter(req => req.category === category);
    if (categoryReqs.length === 0) return 0;
    
    const completedCount = categoryReqs.filter(
      req => req.status === 'completed' || req.status === 'waived'
    ).length;
    
    return Math.round((completedCount / categoryReqs.length) * 100);
  };
  
  // Create the context value with all the properties and methods
  const contextValue: DashboardContextValue = {
    userId,
    role,
    tierInfo,
    requirements,
    isLoading,
    error,
    refreshData,
    filterRequirements,
    getCategoryCompletionPercentage
  };
  
  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

/**
 * Hook to use the dashboard context in components
 * @returns The dashboard context value
 * @throws Error if used outside of a DashboardContextProvider
 */
export function useDashboard() {
  const context = useContext(DashboardContext);
  
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardContextProvider');
  }
  
  return context;
}