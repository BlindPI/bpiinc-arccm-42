
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { FailedGenerationsTable } from './FailedGenerationsTable';
import { OrphanedCertificatesTable } from './OrphanedCertificatesTable';

export function CertificateRecoveryDashboard() {
  const { data: profile } = useProfile();
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <FailedGenerationsTable />
      <OrphanedCertificatesTable />
    </div>
  );
}
