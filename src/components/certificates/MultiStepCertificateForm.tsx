
import React, { useState } from 'react';
import { StepPersonalInfo } from './StepPersonalInfo';
import { StepCourseDetails } from './StepCourseDetails';
import { StepDates } from './StepDates';
import { StepReview } from './StepReview';
import { ProgressIndicator } from './ProgressIndicator';
import { ValidationChecklist } from './ValidationChecklist';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useFontLoader } from '@/hooks/useFontLoader';
import { useCertificateFormHandler } from '@/hooks/useCertificateFormHandler';
import { CertificateFormHandler } from './CertificateFormHandler';
import { useTemplateVerification } from '@/hooks/useTemplateVerification';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';

export function MultiStepCertificateForm() {
  const [step, setStep] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [firstAidLevel, setFirstAidLevel] = useState('');
  const [cprLevel, setCprLevel] = useState('');
  const [assessmentStatus, setAssessmentStatus] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const { fontCache, isFontLoading, fontsLoaded } = useFontLoader();
  const { isTemplateAvailable, defaultTemplateUrl } = useTemplateVerification();
  
  const handleClearForm = () => {
    setRecipientName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setFirstAidLevel('');
    setCprLevel('');
    setAssessmentStatus('');
    setIssueDate('');
    setExpiryDate('');
    setSelectedCourseId('');
    setIsValidated(false);
    setStep(1);
  };

  const isFormValid = () => {
    switch (step) {
      case 1:
        return recipientName && email;
      case 2:
        return selectedCourseId;
      case 3:
        return issueDate && expiryDate;
      case 4:
        return isValidated;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isFormValid() && step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <>
      <ProgressIndicator step={step} />
      
      <CardContent className="pt-6 pb-4">
        <div className="space-y-6">
          {step === 1 && (
            <StepPersonalInfo
              recipientName={recipientName}
              setRecipientName={setRecipientName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              company={company}
              setCompany={setCompany}
            />
          )}
          
          {step === 2 && (
            <StepCourseDetails
              selectedCourseId={selectedCourseId}
              setSelectedCourseId={setSelectedCourseId}
              firstAidLevel={firstAidLevel}
              setFirstAidLevel={setFirstAidLevel}
              cprLevel={cprLevel}
              setCprLevel={setCprLevel}
              assessmentStatus={assessmentStatus}
              setAssessmentStatus={setAssessmentStatus}
            />
          )}
          
          {step === 3 && (
            <StepDates
              issueDate={issueDate}
              expiryDate={expiryDate}
              setIssueDate={setIssueDate}
              setExpiryDate={setExpiryDate}
            />
          )}
          
          {step === 4 && (
            <>
              <StepReview
                recipientName={recipientName}
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
                setIsValidated={setIsValidated}
              />
              
              <ValidationChecklist 
                name={recipientName}
                email={email}
                selectedCourseId={selectedCourseId}
                issueDate={issueDate}
                expiryDate={expiryDate}
                isValidated={isValidated}
                setIsValidated={setIsValidated}
              />
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t bg-muted/10 px-6 py-4">
        <div>
          {step > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {step < 4 ? (
            <Button 
              type="button" 
              onClick={handleNext}
              disabled={!isFormValid()}
              className="flex items-center gap-1"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <CertificateFormHandler
              name={recipientName}
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
              onSuccess={handleClearForm}
            >
              <Button 
                type="submit" 
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                disabled={!isFormValid()}
              >
                {isAdmin ? (
                  <>
                    <Save className="h-4 w-4" />
                    Generate Certificate
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </CertificateFormHandler>
          )}
        </div>
      </CardFooter>
    </>
  );
}
