
import React from 'react';
import { Card } from '@/components/ui/card';
import { FormHeader } from './FormHeader';
import { MultiStepCertificateForm } from './MultiStepCertificateForm';
import { useProfile } from '@/hooks/useProfile';

export function CertificateForm() {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  return (
    <Card>
      <FormHeader isAdmin={isAdmin} />
      <MultiStepCertificateForm />
    </Card>
  );
}
