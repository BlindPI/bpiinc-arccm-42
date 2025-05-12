
import React from 'react';
import { Button } from '@/components/ui/button';
import { RosterReview } from '@/components/certificates/RosterReview';
import { useBatchUpload } from './BatchCertificateContext';
import { useCourseData } from '@/hooks/useCourseData';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList } from 'lucide-react';

export function BatchReview() {
  const {
    processedData,
    selectedCourseId,
    enableCourseMatching,
    extractedCourse,
    isFormValid,
    rosterName,
    setRosterName,
    rosterDescription,
    setRosterDescription
  } = useBatchUpload();
  const { data: courses } = useCourseData();
  
  // Find the selected course to display its name
  const selectedCourse = React.useMemo(() => {
    if (!courses || !selectedCourseId) return null;
    return courses.find(course => course.id === selectedCourseId);
  }, [courses, selectedCourseId]);

  // Generate a default roster name if none is provided
  React.useEffect(() => {
    if (!rosterName && selectedCourse) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      const defaultName = `${selectedCourse.name} - ${formattedDate}`;
      setRosterName(defaultName);
    }
  }, [selectedCourse, rosterName, setRosterName]);

  if (!processedData) {
    return (
      <div className="text-center py-8">
        <p>No data to review. Please go back and upload a file.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Review Certificate Information</h3>
          <p className="text-sm text-muted-foreground">
            Please review the certificate information before submitting
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="rosterName" className="text-base">Roster Name <span className="text-destructive">*</span></Label>
          <Input 
            id="rosterName"
            placeholder="Enter roster name"
            value={rosterName}
            onChange={(e) => setRosterName(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Give this batch a descriptive name to easily identify it later
          </p>
        </div>
        
        <div>
          <Label htmlFor="rosterDescription" className="text-base">Description</Label>
          <Textarea 
            id="rosterDescription"
            placeholder="Enter optional description"
            value={rosterDescription}
            onChange={(e) => setRosterDescription(e.target.value)}
            className="mt-1 h-20"
          />
        </div>
      </div>
      
      <RosterReview 
        data={processedData.data}
        totalCount={processedData.totalCount}
        errorCount={processedData.errorCount}
        enableCourseMatching={enableCourseMatching}
        selectedCourseId={selectedCourseId}
        extractedCourse={extractedCourse}
      />
    </div>
  );
}
