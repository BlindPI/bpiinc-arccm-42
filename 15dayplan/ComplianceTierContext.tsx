// File: src/contexts/ComplianceTierContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';

interface ComplianceTierContextType {
  tier: 'basic' | 'robust';
  isBasic: boolean;
  isRobust: boolean;
  tierConfig: {
    name: string;
    description: string;
    features: string[];
    limitations?: string[];
  };
}

const ComplianceTierContext = createContext<ComplianceTierContextType | undefined>(undefined);

interface ComplianceTierProviderProps {
  tier: 'basic' | 'robust';
  children: ReactNode;
}

export function ComplianceTierProvider({ tier, children }: ComplianceTierProviderProps) {
  const tierConfigs = {
    basic: {
      name: 'Essential Tier',
      description: 'Core compliance requirements for quick certification',
      features: [
        'Basic requirements only',
        'Streamlined process', 
        'Quick certification',
        'Essential compliance'
      ],
      limitations: [
        'Limited advanced features',
        'Basic reporting only'
      ]
    },
    robust: {
      name: 'Comprehensive Tier',
      description: 'Complete compliance pathway with advanced features',
      features: [
        'Full requirement set',
        'Advanced features',
        'Comprehensive reporting',
        'Mentorship capabilities',
        'Course creation tools'
      ]
    }
  };
  
  const value: ComplianceTierContextType = {
    tier,
    isBasic: tier === 'basic',
    isRobust: tier === 'robust',
    tierConfig: tierConfigs[tier]
  };
  
  return (
    <ComplianceTierContext.Provider value={value}>
      {children}
    </ComplianceTierContext.Provider>
  );
}

export function useComplianceTierContext() {
  const context = useContext(ComplianceTierContext);
  if (context === undefined) {
    throw new Error('useComplianceTierContext must be used within a ComplianceTierProvider');
  }
  return context;
}