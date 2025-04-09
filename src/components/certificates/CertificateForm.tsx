import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FIELD_CONFIGS } from '@/types/certificate';
import { useFontLoader } from '@/hooks/useFontLoader';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseSelector } from './CourseSelector';
import { DateInputs } from './DateInputs';

export function CertificateForm() {
  const [name, setName] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const { fontCache, fontsLoaded } = useFontLoader();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateAvailable, setIsTemplateAvailable] = useState<boolean>(false);
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const createCertificateRequest = useMutation({
    mutationFn: async (data: {
      recipientName: string;
      courseId: string;
      courseName: string;
      issueDate: string;
      expiryDate: string;
    }) => {
      const { error } = await supabase.from('certificate_requests').insert({
        user_id: user?.id,
        recipient_name: data.recipientName,
        course_name: data.courseName,
        issue_date: data.issueDate,
        expiry_date: data.expiryDate,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      toast.success('Certificate request submitted successfully');
      setName('');
      setSelectedCourseId('');
      setIssueDate('');
      setExpiryDate('');
    },
    onError: (error) => {
      console.error('Error creating certificate request:', error);
      toast.error('Failed to submit certificate request');
    },
  });

  React.useEffect(() => {
    verifyTemplateAvailability();
  }, []);

  const verifyTemplateAvailability = async () => {
    try {
      const templateUrl = 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/certificate-template/default-template.pdf';
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

    const selectedCourse = await queryClient.fetchQuery({
      queryKey: ['courses'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('courses')
          .select('id, name, expiration_months')
          .eq('id', selectedCourseId)
          .single();

        if (error) throw error;
        return data;
      },
    });

    if (!selectedCourse) {
      toast.error('Invalid course selected');
      return;
    }

    const canGenerateDirect = profile?.role && ['SA', 'AD'].includes(profile.role);

    if (canGenerateDirect && isTemplateAvailable) {
      setIsGenerating(true);

      try {
        const templateUrl = 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/certificate-template/default-template.pdf';
        const pdfBytes = await generateCertificatePDF(
          templateUrl,
          { 
            name, 
            course: selectedCourse.name, 
            issueDate, 
            expiryDate 
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
      createCertificateRequest.mutate({
        recipientName: name,
        courseId: selectedCourseId,
        courseName: selectedCourse.name,
        issueDate,
        expiryDate,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificate Request</CardTitle>
        <CardDescription>
          {profile?.role && ['SA', 'AD'].includes(profile.role)
            ? 'Generate certificates directly'
            : 'Submit a certificate request for approval'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Recipient Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter recipient's name"
            />
          </div>
          
          <CourseSelector
            selectedCourseId={selectedCourseId}
            onCourseSelect={setSelectedCourseId}
          />
          
          <DateInputs
            issueDate={issueDate}
            expiryDate={expiryDate}
            onIssueDateChange={setIssueDate}
            onExpiryDateChange={setExpiryDate}
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={createCertificateRequest.isPending || isGenerating}
          >
            {createCertificateRequest.isPending || isGenerating 
              ? 'Processing...' 
              : profile?.role && ['SA', 'AD'].includes(profile.role)
                ? 'Generate Certificate'
                : 'Submit Request'
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
