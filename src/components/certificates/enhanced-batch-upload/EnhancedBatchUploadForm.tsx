
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { EnhancedFileDropZone } from './EnhancedFileDropZone';
import { RosterReviewSection } from './RosterReviewSection';
import { ValidationSummary } from './ValidationSummary';
import { MandatoryLocationSelector } from './MandatoryLocationSelector';
import { CourseSelector } from '../CourseSelector';
import { BatchValidationResult, ProcessedRosterData } from '@/types/certificateValidation';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export function EnhancedBatchUploadForm() {
  const { data: profile } = useProfile();
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [processedData, setProcessedData] = useState<ProcessedRosterData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequestsMutation = useMutation({
    mutationFn: async (requests: any[]) => {
      const { data, error } = await supabase
        .from('certificate_requests')
        .insert(requests);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Batch requests submitted successfully!');
      setProcessedData(null);
      setSelectedLocationId('');
      setSelectedCourseId('');
      setIssueDate('');
    },
    onError: (error) => {
      console.error('Submission error:', error);
      toast.error('Failed to submit requests');
    }
  });

  const handleFileProcessed = (data: any[], validation: BatchValidationResult) => {
    const processedRoster: ProcessedRosterData = {
      requests: data,
      validation,
      metadata: {
        fileName: 'roster.xlsx',
        processedAt: new Date().toISOString(),
        totalRows: data.length,
        validRows: validation.validRecords
      }
    };
    
    setProcessedData(processedRoster);
  };

  const handleSubmit = async () => {
    if (!processedData || !profile) return;
    
    setIsSubmitting(true);
    
    try {
      const validRequests = processedData.requests
        .filter(req => !req.validationErrors || req.validationErrors.length === 0)
        .map(req => ({
          recipient_name: req.recipientName,
          email: req.email,
          phone: req.phone,
          company: req.company,
          course_name: req.courseName,
          location_id: selectedLocationId,
          assessment_status: req.assessmentStatus,
          issue_date: req.issueDate,
          expiry_date: req.expiryDate,
          status: 'PENDING',
          user_id: profile.id,
          instructor_name: req.instructorName,
          first_aid_level: req.firstAidLevel,
          cpr_level: req.cprLevel,
          batch_name: `Batch_${new Date().toISOString().split('T')[0]}`
        }));

      await submitRequestsMutation.mutateAsync(validRequests);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = processedData && 
    processedData.validation.isValid && 
    selectedLocationId && 
    selectedCourseId && 
    issueDate;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Batch Certificate Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <MandatoryLocationSelector
                selectedLocationId={selectedLocationId}
                onLocationChange={setSelectedLocationId}
              />
            </div>
            
            <div>
              <Label htmlFor="course">Course *</Label>
              <CourseSelector
                selectedCourseId={selectedCourseId}
                onCourseSelect={setSelectedCourseId}
              />
            </div>
            
            <div>
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* File Upload Section */}
          {selectedLocationId && selectedCourseId && issueDate && (
            <EnhancedFileDropZone
              onFileProcessed={handleFileProcessed}
              locationId={selectedLocationId}
              courseId={selectedCourseId}
              issueDate={issueDate}
            />
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {processedData && (
        <div className="space-y-6">
          <ValidationSummary result={processedData.validation} />
          
          <RosterReviewSection 
            data={processedData.requests}
            validationResult={processedData.validation}
          />
          
          {processedData.validation.validRecords > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Ready to Submit</h3>
                    <p className="text-sm text-gray-600">
                      {processedData.validation.validRecords} valid requests will be submitted
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Requests'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
