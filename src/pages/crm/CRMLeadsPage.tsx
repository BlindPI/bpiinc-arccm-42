import React from 'react';
import { CRMPlaceholder } from '@/components/crm/common/CRMPlaceholder';

export const CRMLeadsPage: React.FC = () => {
  return (
    <CRMPlaceholder
      title="Lead Management"
      description="Comprehensive lead tracking and qualification system"
      features={[
        "Lead capture from multiple sources (web forms, imports, manual entry)",
        "Automated lead scoring based on configurable criteria",
        "Lead assignment and territory management",
        "Lead qualification workflows and status tracking",
        "Bulk import and export capabilities",
        "Lead source performance analytics",
        "Follow-up scheduling and reminder system",
        "Lead conversion tracking to opportunities"
      ]}
    />
  );
};