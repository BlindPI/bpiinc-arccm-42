
import React from 'react';
import { Card } from '@/components/ui/card';
import { FormHeader } from './FormHeader';
import { MultiStepCertificateForm } from './MultiStepCertificateForm';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

export function CertificateForm() {
  const { data: profile, isLoading } = useProfile();
  
  if (isLoading) {
    return (
      <Card className="relative min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading profile information...</p>
        </div>
      </Card>
    );
  }
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  return (
    <Card className="shadow-md overflow-hidden animate-fade-in">
      <FormHeader isAdmin={isAdmin} />
      <MultiStepCertificateForm />
    </Card>
  );
}
