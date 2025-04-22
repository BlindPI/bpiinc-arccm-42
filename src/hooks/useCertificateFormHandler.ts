
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateGeneration } from '@/hooks/useCertificateGeneration';
import { useCertificateSubmission } from '@/hooks/useCertificateSubmission';
import { FONT_FILES } from '@/types/certificate';
import { FontCache } from '@/hooks/useFontLoader';

interface UseCertificateFormHandlerProps {
  name: string;
  email: string;
  phone: string;
  company: string;
  firstAidLevel: string;
  cprLevel: string;
  assessmentStatus: string;
  selectedCourseId: string;
  issueDate: string;
  expiryDate: string;
  isValidated: boolean;
  fontCache: FontCache;
  isTemplateAvailable: boolean;
  defaultTemplateUrl: string | null;
  isFontLoading: boolean;
  fontsLoaded: boolean;
  onSuccess: () => void;
}

export function useCertificateFormHandler() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { generateCertificate, isGenerating } = useCertificateGeneration({} as FontCache); // Will be overridden by actual fontCache
  const { createCertificateRequest, validateAndFormatDates } = useCertificateSubmission();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async ({
    name,
    email,
    phone,
    company,
    firstAidLevel,
    cprLevel,
    assessmentStatus,
    selectedCourseId,
    issueDate,
    expiryDate,
    isValidated,
    fontCache,
    isTemplateAvailable,
    defaultTemplateUrl,
    isFontLoading,
    fontsLoaded,
    onSuccess
  }: UseCertificateFormHandlerProps) => {
    if (!user) {
      toast.error('Please sign in to request certificates');
      return;
    }

    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }

    if (!isValidated) {
      toast.error('Please complete the validation checklist before submitting');
      return;
    }
    
    if (isFontLoading) {
      toast.error('Please wait for fonts to load before proceeding');
      return;
    }
    
    const canGenerateDirect = profile?.role && ['SA', 'AD'].includes(profile.role);
    
    // Verify fonts are loaded - strict requirement now
    const areFontsReady = Object.keys(fontCache).length > 0 && fontsLoaded;
    const requiredFontCount = Object.keys(FONT_FILES).length;
    const hasAllRequiredFonts = Object.keys(fontCache).length >= requiredFontCount;
    
    if (canGenerateDirect && !hasAllRequiredFonts) {
      toast.error(`Missing required fonts for certificate generation. Please upload all required fonts first.`);
      return;
    }

    // Use validateAndFormatDates with the courseId to calculate expiry date based on course duration
    const dateValidation = validateAndFormatDates(issueDate, selectedCourseId);
    if (!dateValidation) return;

    const { formattedIssueDate, formattedExpiryDate } = dateValidation;
    
    setIsSubmitting(true);

    try {
      if (canGenerateDirect && isTemplateAvailable && defaultTemplateUrl) {
        await generateCertificate({
          name,
          course: selectedCourseId,
          issueDate: formattedIssueDate,
          expiryDate: formattedExpiryDate
        }, defaultTemplateUrl);
        onSuccess();
      } else {
        await new Promise<void>((resolve, reject) => {
          createCertificateRequest.mutate({
            recipientName: name,
            email,
            phone,
            company,
            firstAidLevel,
            cprLevel,
            assessmentStatus,
            courseId: selectedCourseId,
            courseName: selectedCourseId, // This will be replaced with the actual course name in the hook
            issueDate: formattedIssueDate,
            expiryDate: formattedExpiryDate
          }, {
            onSuccess: () => {
              onSuccess();
              resolve();
            },
            onError: (error) => {
              reject(error);
            }
          });
        });
      }
    } catch (error) {
      console.error('Error in certificate submission:', error);
      toast.error(`Failed to submit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  return {
    handleSubmit,
    isSubmitting: isSubmitting || createCertificateRequest.isPending || isGenerating,
    isAdmin
  };
}
