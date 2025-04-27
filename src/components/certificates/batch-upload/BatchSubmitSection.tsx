
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { useBatchUpload } from './BatchCertificateContext';
import { useCourseData } from '@/hooks/useCourseData';
import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useLocationData } from '@/hooks/useLocationData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface BatchSubmitSectionProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  hasErrors: boolean;
  disabled: boolean;
}

export function BatchSubmitSection({
  onSubmit,
  isSubmitting,
  hasErrors,
  disabled
}: BatchSubmitSectionProps) {
  const { 
    selectedCourseId,
    selectedLocationId,
    setSelectedLocationId,
    extractedCourse,
    hasCourseMatches,
    isValidated
  } = useBatchUpload();
  
  const { data: courses } = useCourseData();
  const { locations, isLoading: isLoadingLocations } = useLocationData();
  
  const [courseInfo, setCourseInfo] = useState<{ name: string; id: string } | null>(null);
  const [locationInfo, setLocationInfo] = useState<{ name: string; id: string } | null>(null);

  // Get course info when courseId or courses changes
  useEffect(() => {
    if (courses) {
      if (selectedCourseId && selectedCourseId !== 'none') {
        const course = courses.find(c => c.id === selectedCourseId);
        if (course) {
          setCourseInfo({ name: course.name, id: course.id });
        } else {
          setCourseInfo(null);
        }
      } else if (extractedCourse) {
        setCourseInfo({ name: extractedCourse.name, id: extractedCourse.id });
      } else {
        setCourseInfo(null);
      }
    }
  }, [selectedCourseId, courses, extractedCourse]);

  // Get location info when locationId or locations changes
  useEffect(() => {
    if (locations && selectedLocationId && selectedLocationId !== 'none') {
      const location = locations.find(l => l.id === selectedLocationId);
      if (location) {
        setLocationInfo({ name: location.name, id: location.id });
      } else {
        setLocationInfo(null);
      }
    } else {
      setLocationInfo(null);
    }
  }, [selectedLocationId, locations]);

  return (
    <div className="space-y-4">
      {/* Show course info */}
      {courseInfo ? (
        <Alert variant="default">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertTitle>Selected Course: {courseInfo.name}</AlertTitle>
          <AlertDescription>All certificate requests will use this course</AlertDescription>
        </Alert>
      ) : hasCourseMatches ? (
        <Alert variant="default">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Course Matches Found</AlertTitle>
          <AlertDescription>Automatic course matching will be applied based on the data</AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>No Course Selected</AlertTitle>
          <AlertDescription>
            No course was selected or detected. You will need to assign courses manually.
          </AlertDescription>
        </Alert>
      )}

      {/* Location Selection - available even in review mode */}
      <div className="space-y-2 p-4 bg-white/70 dark:bg-secondary/70 border border-card rounded-xl shadow-sm">
        <Label htmlFor="location-select">Select Location</Label>
        {isLoadingLocations ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading locations...</span>
          </div>
        ) : (
          <Select
            value={selectedLocationId || 'none'}
            onValueChange={setSelectedLocationId}
          >
            <SelectTrigger id="location-select">
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific location</SelectItem>
              {locations?.filter(location => location.status === 'ACTIVE').map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">
          Select a location to use location-specific templates
        </p>
      </div>

      {/* Location info display */}
      {locationInfo && (
        <Alert variant="default">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertTitle>Selected Location: {locationInfo.name}</AlertTitle>
          <AlertDescription>
            All certificate requests will use templates associated with this location
          </AlertDescription>
        </Alert>
      )}
      
      {/* Validation warning */}
      {!isValidated && !isSubmitting && (
        <Alert variant="destructive">
          <AlertTitle>Validation Required</AlertTitle>
          <AlertDescription>
            You must complete the validation checklist before submitting the batch.
          </AlertDescription>
        </Alert>
      )}

      {/* Error warning */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTitle>Errors Found</AlertTitle>
          <AlertDescription>
            Some rows contain errors. They will be skipped during submission.
          </AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={onSubmit} 
        disabled={disabled || isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting Batch...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Submit Certificate Requests Batch
          </>
        )}
      </Button>
    </div>
  );
}
