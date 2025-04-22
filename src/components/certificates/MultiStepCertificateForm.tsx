
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFontLoader } from '@/hooks/useFontLoader';
import { useTemplateVerification } from '@/hooks/useTemplateVerification';
import { CertificateFormHandler } from './CertificateFormHandler';
import { StepPersonalInfo } from './StepPersonalInfo';
import { StepCourseDetails } from './StepCourseDetails';
import { StepDates } from './StepDates';
import { StepReview } from './StepReview';
import { ProgressIndicator } from './ProgressIndicator';

// (Component with state and navigation -- child components handle details)
export function MultiStepCertificateForm() {
  // Form state
  const [step, setStep] = useState(1);
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
  
  const { fontCache, isLoading: isFontLoading, fontsLoaded } = useFontLoader();
  const { 
    isTemplateAvailable, 
    defaultTemplateUrl,
    isLoading: isTemplateLoading 
  } = useTemplateVerification();

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
    setStep(1);
  };

  // Determine if current step is complete to enable the next button
  const isStepComplete = () => {
    switch (step) {
      case 1:
        return name.trim() !== '' && email.trim() !== '' && phone.trim() !== '' && company.trim() !== '';
      case 2:
        return selectedCourseId !== '' && firstAidLevel !== '' && cprLevel !== '' && assessmentStatus !== '';
      case 3:
        return issueDate !== '' && expiryDate !== '';
      case 4:
        return isValidated;
      default:
        return false;
    }
  };

  // Compose step components
  let CurrentStep;
  if (step === 1) {
    CurrentStep = (
      <StepPersonalInfo
        name={name}
        email={email}
        phone={phone}
        company={company}
        setName={setName}
        setEmail={setEmail}
        setPhone={setPhone}
        setCompany={setCompany}
      />
    );
  } else if (step === 2) {
    CurrentStep = (
      <StepCourseDetails
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
        setName={setName}
        setEmail={setEmail}
        setPhone={setPhone}
        setCompany={setCompany}
        setFirstAidLevel={setFirstAidLevel}
        setCprLevel={setCprLevel}
        setAssessmentStatus={setAssessmentStatus}
        setSelectedCourseId={setSelectedCourseId}
        setIssueDate={setIssueDate}
        setExpiryDate={setExpiryDate}
        setIsValidated={setIsValidated}
      />
    );
  } else if (step === 3) {
    CurrentStep = (
      <StepDates
        issueDate={issueDate}
        expiryDate={expiryDate}
        setIssueDate={setIssueDate}
        setExpiryDate={setExpiryDate}
      />
    );
  } else if (step === 4) {
    CurrentStep = (
      <StepReview
        name={name}
        email={email}
        phone={phone}
        company={company}
        selectedCourseId={selectedCourseId}
        firstAidLevel={firstAidLevel}
        cprLevel={cprLevel}
        assessmentStatus={assessmentStatus}
        issueDate={issueDate}
        expiryDate={expiryDate}
        isValidated={isValidated}
        setIsValidated={setIsValidated}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <ProgressIndicator step={step} />
        <CardContent className="p-6">
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
            isFontLoading={isFontLoading}
            fontsLoaded={fontsLoaded}
            onSuccess={resetForm}
          >
            {CurrentStep}
            <div className="mt-8 flex justify-between">
              <Button 
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                variant="outline"
              >
                Previous
              </Button>
              {step < 4 ? (
                <Button 
                  onClick={() => isStepComplete() && setStep(Math.min(4, step + 1))}
                  disabled={!isStepComplete()}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit"
                  disabled={!isValidated}
                >
                  Submit Request
                </Button>
              )}
            </div>
          </CertificateFormHandler>
        </CardContent>
      </Card>
    </div>
  );
}
