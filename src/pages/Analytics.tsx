
import React from 'react';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';
import { APAnalyticsDashboard } from '@/components/analytics/APAnalyticsDashboard';
import { useProfile } from '@/hooks/useProfile';

export default function Analytics() {
  const { data: profile } = useProfile();
  
  // Route AP users to specialized dashboard
  if (profile?.role === 'AP') {
    return <APAnalyticsDashboard />;
  }
  
  // All other users get the advanced dashboard
  return <AdvancedAnalyticsDashboard />;
}
