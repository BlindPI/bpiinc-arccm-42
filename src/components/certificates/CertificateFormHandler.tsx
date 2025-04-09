
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateGeneration } from '@/hooks/useCertificateGeneration';
import { useCertificateSubmission } from '@/hooks/useCertificateSubmission';
import { toast } from 'sonner';
import { FontCache } from '@/hooks/useFontLoader';
import { Loader2 } from 'lucide-react';
import { FONT_FILES } from '@/types/certificate';

interface CertificateFormHandlerProps {
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
  children: React.ReactNode;
}

export function CertificateFormHandler({
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
  onSuccess,
  children
}: CertificateFormHandlerProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { generateCertificate, isGenerating } = useCertificateGeneration(fontCache);
  const { createCertificateRequest, validateAndFormatDates } = useCertificateSubmission();
  
  // Verify fonts are loaded - strict requirement now
  const areFontsReady = Object.keys(fontCache).length > 0 && fontsLoaded;
  const requiredFontCount = Object.keys(FONT_FILES).length;
  const hasAllRequiredFonts = Object.keys(fontCache).length >= requiredFontCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    
    if (canGenerateDirect && !hasAllRequiredFonts) {
      toast.error(`Missing required fonts for certificate generation. Please upload all required fonts first.`);
      return;
    }

    // Use validateAndFormatDates with the courseId to calculate expiry date based on course duration
    const dateValidation = validateAndFormatDates(issueDate, selectedCourseId);
    if (!dateValidation) return;

    const { formattedIssueDate, formattedExpiryDate } = dateValidation;

    if (canGenerateDirect && isTemplateAvailable && defaultTemplateUrl) {
      try {
        await generateCertificate({
          name,
          course: selectedCourseId,
          issueDate: formattedIssueDate,
          expiryDate: formattedExpiryDate
        }, defaultTemplateUrl);
        onSuccess();
      } catch (error) {
        console.error('Error generating certificate:', error);
        toast.error(`Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
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
        }
      });
    }
  };

  const isSubmitting = createCertificateRequest.isPending || isGenerating;
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isFormDisabled = isSubmitting || !isValidated || isFontLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {children}
      
      {isFontLoading ? (
        <div className="text-amber-500 flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading required fonts for certificates...
        </div>
      ) : !hasAllRequiredFonts && isAdmin ? (
        <div className="text-red-500 flex items-center gap-2 text-sm">
          Missing required fonts for certificate generation. Please upload all fonts in Templates tab.
        </div>
      ) : hasAllRequiredFonts ? (
        <div className="text-green-500 flex items-center gap-2 text-sm">
          All required fonts loaded successfully.
        </div>
      ) : null}
      
      <button 
        type="submit" 
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isFormDisabled || (isAdmin && !hasAllRequiredFonts)}
      >
        {isSubmitting 
          ? 'Processing...' 
          : isFontLoading
            ? 'Waiting for fonts...'
            : isAdmin && !hasAllRequiredFonts
              ? 'Missing required fonts'
              : isAdmin
                ? 'Generate Certificate'
                : 'Submit Request'
        }
      </button>
    </form>
  );
}
