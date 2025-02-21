import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FIELD_CONFIGS } from '@/types/certificate';
import { useFontLoader } from '@/hooks/useFontLoader';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CourseSelector } from '@/components/certificates/CourseSelector';
import { addMonths, format, isValid, parse } from 'date-fns';
import { Download } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  expiration_months: number;
}

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

  // Fetch available courses
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, expiration_months')
        .eq('status', 'ACTIVE')
        .order('name');

      if (error) throw error;
      return data as Course[];
    },
  });

  // Calculate expiry date when issue date or selected course changes
  useEffect(() => {
    if (issueDate && selectedCourseId && courses) {
      try {
        const selectedCourse = courses.find(course => course.id === selectedCourseId);
        if (selectedCourse) {
          // Parse the issue date string to a Date object using the new format
          const parsedIssueDate = parse(issueDate, 'MMMM-dd-yyyy', new Date());
          if (isValid(parsedIssueDate)) {
            // Add the course's expiration months to get the expiry date
            const calculatedExpiryDate = addMonths(parsedIssueDate, selectedCourse.expiration_months);
            // Format the expiry date back to string in the new format
            setExpiryDate(format(calculatedExpiryDate, 'MMMM-dd-yyyy'));
          }
        }
      } catch (error) {
        console.error('Error calculating expiry date:', error);
      }
    }
  }, [issueDate, selectedCourseId, courses]);

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

  React.useEffect(() => {
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

    const selectedCourse = courses?.find(course => course.id === selectedCourseId);
    if (!selectedCourse) {
      toast.error('Invalid course selected');
      return;
    }

    // Check if the user has a role that allows direct certificate generation (SA or AD only)
    const canGenerateDirect = profile?.role && ['SA', 'AD'].includes(profile.role);

    // When submitting to database, convert dates to ISO format
    const parsedIssueDate = parse(issueDate, 'MMMM-dd-yyyy', new Date());
    const parsedExpiryDate = parse(expiryDate, 'MMMM-dd-yyyy', new Date());

    if (!isValid(parsedIssueDate) || !isValid(parsedExpiryDate)) {
      toast.error('Invalid date format. Please use Month-DD-YYYY format (e.g., January-01-2024)');
      return;
    }

    if (canGenerateDirect && isTemplateAvailable) {
      setIsGenerating(true);

      try {
        const templateUrl = 'https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';
        const pdfBytes = await generateCertificatePDF(
          templateUrl,
          { 
            name, 
            course: selectedCourse.name, 
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
        courseName: selectedCourse.name,
        issueDate: format(parsedIssueDate, 'MMMM-dd-yyyy'),
        expiryDate: format(parsedExpiryDate, 'MMMM-dd-yyyy')
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
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a 
              href="https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="w-4 h-4" />
              Download Template
            </a>
          </Button>
          <span className="text-sm text-muted-foreground">
            Download the template before submitting your request
          </span>
        </div>
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

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter recipient's email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter recipient's phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter recipient's company"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="firstAidLevel">First Aid Level</Label>
            <Select value={firstAidLevel} onValueChange={setFirstAidLevel}>
              <SelectTrigger id="firstAidLevel">
                <SelectValue placeholder="Select first aid level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cprLevel">CPR Level</Label>
            <Select value={cprLevel} onValueChange={setCprLevel}>
              <SelectTrigger id="cprLevel">
                <SelectValue placeholder="Select CPR level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Level A</SelectItem>
                <SelectItem value="C">Level C</SelectItem>
                <SelectItem value="BLS">BLS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessmentStatus">Assessment Status</Label>
            <Select value={assessmentStatus} onValueChange={setAssessmentStatus}>
              <SelectTrigger id="assessmentStatus">
                <SelectValue placeholder="Select assessment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PASS">Pass</SelectItem>
                <SelectItem value="FAIL">Fail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
