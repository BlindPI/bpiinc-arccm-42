import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { FIELD_CONFIGS } from '@/types/certificate';
import { useFontLoader } from '@/hooks/useFontLoader';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseSelector } from '@/components/certificates/CourseSelector';
import { format, isValid, parse } from 'date-fns';
import { FormHeader } from './certificates/FormHeader';
import { RecipientFields } from './certificates/RecipientFields';
import { AssessmentFields } from './certificates/AssessmentFields';
import { ValidationChecklist } from './certificates/ValidationChecklist';

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
  const { fontCache, fontsLoaded } = useFontLoader();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateAvailable, setIsTemplateAvailable] = useState<boolean>(false);
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    verifyTemplateAvailability();
  }, []);

  const verifyTemplateAvailability = async () => {
    try {
      const templateUrl = 'https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';
      const response = await fetch(templateUrl, { method: 'HEAD' });
      setIsTemplateAvailable(response.ok);
      
      if (!response.ok) {
        toast.error('Certificate template is not available. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying template:', error);
      setIsTemplateAvailable(false);
      toast.error('Unable to verify template availability');
    }
  };

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      toast.success('Certificate request submitted successfully');
      // Reset form
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
    },
    onError: (error) => {
      console.error('Error creating certificate request:', error);
      toast.error('Failed to submit certificate request');
    },
  });

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

    // Check if the user has a role that allows direct certificate generation
    const canGenerateDirect = profile?.role && ['SA', 'AD'].includes(profile.role);

    if (canGenerateDirect && isTemplateAvailable) {
      setIsGenerating(true);

      try {
        const templateUrl = 'https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';
        const pdfBytes = await generateCertificatePDF(
          templateUrl,
          { 
            name, 
            course: selectedCourseId,
            issueDate: format(parsedIssueDate, 'MMMM-dd-yyyy'),
            expiryDate: format(parsedExpiryDate, 'MMMM-dd-yyyy')
          },
          fontCache,
          FIELD_CONFIGS
        );

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `certificate-${name}.pdf`;
        link.click();

        toast.success('Certificate generated successfully');
      } catch (error) {
        console.error('Error generating certificate:', error);
        let errorMessage = 'Error generating certificate.';
        if (error instanceof Error) {
          errorMessage += ` ${error.message}`;
        }
        toast.error(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Submit certificate request for approval
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
          <RecipientFields
            name={name}
            email={email}
            phone={phone}
            company={company}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPhoneChange={setPhone}
            onCompanyChange={setCompany}
          />
          
          <AssessmentFields
            firstAidLevel={firstAidLevel}
            cprLevel={cprLevel}
            assessmentStatus={assessmentStatus}
            onFirstAidLevelChange={setFirstAidLevel}
            onCprLevelChange={setCprLevel}
            onAssessmentStatusChange={setAssessmentStatus}
          />
          
          <CourseSelector 
            selectedCourseId={selectedCourseId}
            onCourseSelect={setSelectedCourseId}
          />
          
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              placeholder="e.g., January-01-2024"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="text"
              value={expiryDate}
              disabled
              className="bg-gray-100"
              placeholder="Auto-calculated based on course duration"
            />
          </div>
          
          <ValidationChecklist onValidationChange={setIsValidated} />
          
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
