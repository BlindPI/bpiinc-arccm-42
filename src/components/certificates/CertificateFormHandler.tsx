
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateGeneration } from '@/hooks/useCertificateGeneration';
import { useCertificateSubmission } from '@/hooks/useCertificateSubmission';
import { toast } from 'sonner';
import { FontCache } from '@/hooks/useFontLoader';

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
  onSuccess,
  children
}: CertificateFormHandlerProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { generateCertificate, isGenerating } = useCertificateGeneration(fontCache);
  const { createCertificateRequest, validateAndFormatDates } = useCertificateSubmission();

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

    const dateValidation = validateAndFormatDates(issueDate, expiryDate);
    if (!dateValidation) return;

    const { formattedIssueDate, formattedExpiryDate } = dateValidation;

    const canGenerateDirect = profile?.role && ['SA', 'AD'].includes(profile.role);

    if (canGenerateDirect && isTemplateAvailable && defaultTemplateUrl) {
      await generateCertificate({
        name,
        course: selectedCourseId,
        issueDate: formattedIssueDate,
        expiryDate: formattedExpiryDate
      }, defaultTemplateUrl);
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
        courseName: selectedCourseId,
        issueDate: formattedIssueDate,
        expiryDate: formattedExpiryDate
      });
    }

    if (createCertificateRequest.isSuccess || !createCertificateRequest.isPending) {
      onSuccess();
    }
  };

  const isSubmitting = createCertificateRequest.isPending || isGenerating;
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {children}
      
      <button 
        type="submit" 
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium"
        disabled={isSubmitting || !isValidated}
      >
        {isSubmitting 
          ? 'Processing...' 
          : isAdmin
            ? 'Generate Certificate'
            : 'Submit Request'
        }
      </button>
    </form>
  );
}
