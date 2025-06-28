
import React from 'react';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';
import { useProfile } from '@/hooks/useProfile';

export default function Analytics() {
  const { data: profile } = useProfile();
  
  // All users get the advanced dashboard now that APAnalyticsDashboard is removed
  return <AdvancedAnalyticsDashboard />;
}
