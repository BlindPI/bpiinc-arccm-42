
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFontLoader } from '@/hooks/useFontLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTemplateVerification } from '@/hooks/useTemplateVerification';
import { FormHeader } from './FormHeader';
import { CertificateFormFields } from './CertificateFormFields';
import { CertificateFormHandler } from './CertificateFormHandler';

export function CertificateForm() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [firstAidLevel, setFirstAidLevel] = useState<string>('');
  const [cprLevel, setCprLevel] = useState<string>('');
  const [assessmentStatus, setAssessmentStatus] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isValidated, setIsValidated] = useState(false);
  
  const { fontCache } = useFontLoader();
  const { 
    isTemplateAvailable, 
    defaultTemplateUrl,
    isLoading: isTemplateLoading 
  } = useTemplateVerification();
  const { data: profile } = useProfile();

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setFirstAidLevel('');
    setCprLevel('');
    setAssessmentStatus('');
    setSelectedCourseId('');
    setIssueDate('');
    setExpiryDate('');
    setIsValidated(false);
  };

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  return (
    <Card>
      <FormHeader isAdmin={isAdmin} />
      <CardContent>
        <CertificateFormHandler
          name={name}
          email={email}
          phone={phone}
          company={company}
          firstAidLevel={firstAidLevel}
          cprLevel={cprLevel}
          assessmentStatus={assessmentStatus}
          selectedCourseId={selectedCourseId}
          issueDate={issueDate}
          expiryDate={expiryDate}
          isValidated={isValidated}
          fontCache={fontCache}
          isTemplateAvailable={isTemplateAvailable}
          defaultTemplateUrl={defaultTemplateUrl}
          onSuccess={resetForm}
        >
          <CertificateFormFields
            name={name}
            email={email}
            phone={phone}
            company={company}
            firstAidLevel={firstAidLevel}
            cprLevel={cprLevel}
            assessmentStatus={assessmentStatus}
            selectedCourseId={selectedCourseId}
            issueDate={issueDate}
            expiryDate={expiryDate}
            isValidated={isValidated}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPhoneChange={setPhone}
            onCompanyChange={setCompany}
            onFirstAidLevelChange={setFirstAidLevel}
            onCprLevelChange={setCprLevel}
            onAssessmentStatusChange={setAssessmentStatus}
            onCourseSelect={setSelectedCourseId}
            onIssueDateChange={setIssueDate}
            onValidationChange={setIsValidated}
          />
        </CertificateFormHandler>
      </CardContent>
    </Card>
  );
}
