
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useFontLoader } from '@/hooks/useFontLoader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parse } from 'date-fns';
import { FormHeader } from './FormHeader';
import { CertificateFormFields } from './CertificateFormFields';
import { useTemplateVerification } from '@/hooks/useTemplateVerification';
import { useCertificateGeneration } from '@/hooks/useCertificateGeneration';

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
  
  const { fontCache, fontsLoaded } = useFontLoader();
  const { 
    isTemplateAvailable, 
    defaultTemplateUrl,
    isLoading: isTemplateLoading 
  } = useTemplateVerification();
  const { generateCertificate, isGenerating } = useCertificateGeneration(fontCache);
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const createCertificateRequest = useMutation({
    mutationFn: async (data: {
      recipientName: string;
      email: string;
      phone: string;
      company: string;
      firstAidLevel: string;
      cprLevel: string;
      assessmentStatus: string;
      courseId: string;
      courseName: string;
      issueDate: string;
      expiryDate: string;
    }) => {
      const { error } = await supabase.from('certificate_requests').insert({
        user_id: user?.id,
        recipient_name: data.recipientName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        first_aid_level: data.firstAidLevel,
        cpr_level: data.cprLevel,
        assessment_status: data.assessmentStatus,
        course_name: data.courseName,
        issue_date: data.issueDate,
        expiry_date: data.expiryDate,
      });

      if (error) throw error;

      // Send notification for new certificate request
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'CERTIFICATE_REQUEST',
            recipientEmail: data.email,
            recipientName: data.recipientName,
            courseName: data.courseName
          }
        });
      } catch (error) {
        console.error('Error sending notification:', error);
        // Don't throw - we don't want to fail the request if just the notification fails
        toast.error('Could not send confirmation email');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      toast.success('Certificate request submitted successfully');
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating certificate request:', error);
      toast.error('Failed to submit certificate request');
    },
  });

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
  };

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

    // Parse dates
    const parsedIssueDate = parse(issueDate, 'MMMM-dd-yyyy', new Date());
    const parsedExpiryDate = parse(expiryDate, 'MMMM-dd-yyyy', new Date());

    if (!isValid(parsedIssueDate) || !isValid(parsedExpiryDate)) {
      toast.error('Invalid date format. Please use Month-DD-YYYY format (e.g., January-01-2024)');
      return;
    }

    const canGenerateDirect = profile?.role && ['SA', 'AD'].includes(profile.role);

    if (canGenerateDirect && isTemplateAvailable && defaultTemplateUrl) {
      await generateCertificate({
        name,
        course: selectedCourseId,
        issueDate: format(parsedIssueDate, 'MMMM-dd-yyyy'),
        expiryDate: format(parsedExpiryDate, 'MMMM-dd-yyyy')
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
        issueDate: format(parsedIssueDate, 'MMMM-dd-yyyy'),
        expiryDate: format(parsedExpiryDate, 'MMMM-dd-yyyy')
      });
    }
  };

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  return (
    <Card>
      <FormHeader isAdmin={isAdmin} />
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={createCertificateRequest.isPending || isGenerating || !isValidated}
          >
            {createCertificateRequest.isPending || isGenerating 
              ? 'Processing...' 
              : isAdmin
                ? 'Generate Certificate'
                : 'Submit Request'
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
