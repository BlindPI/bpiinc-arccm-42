
import React from 'react';
import { ProfessionalCRMLayout } from '@/components/crm/ProfessionalCRMLayout';
import { useRealtimeCRMData } from '@/hooks/useRealtimeCRMData';

export default function CRM() {
  // Enable real-time updates for CRM data
  useRealtimeCRMData();

  return <ProfessionalCRMLayout />;
}
