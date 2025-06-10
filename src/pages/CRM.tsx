
import React from 'react';
import { ResponsiveCRMDashboard } from '@/components/crm/dashboard/ResponsiveCRMDashboard';
import { useRealtimeCRMData } from '@/hooks/useRealtimeCRMData';

export default function CRM() {
  // Enable real-time updates for CRM data
  useRealtimeCRMData();

  return <ResponsiveCRMDashboard />;
}
