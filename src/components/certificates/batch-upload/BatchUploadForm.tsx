
import { useState } from 'react';
import { FileDropZone } from '../FileDropZone';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useBatchUpload } from './BatchCertificateContext';
import { useCourseData } from '@/hooks/useCourseData';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';

interface BatchUploadFormProps {
  onFileUpload: (file: File) => Promise<void>;
}

export function BatchUploadForm({ onFileUpload }: BatchUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { 
    enableCourseMatching, 
    setEnableCourseMatching,
    selectedCourseId,
    setSelectedCourseId,
    selectedLocationId,
    setSelectedLocationId
  } = useBatchUpload();

  const { data: courses, isLoading: isLoadingCourses } = useCourseData();
  const { locations, isLoading: isLoadingLocations } = useLocationData();

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await onFileUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <FileDropZone 
        onFileSelected={handleUpload} 
        isUploading={isUploading} 
        disabled={isUploading}
      />
      
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Course Selection */}
        <div className="space-y-2">
          <Label htmlFor="course-select">Pre-select Course (Optional)</Label>
          {isLoadingCourses ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading courses...</span>
            </div>
          ) : (
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
            >
              <SelectTrigger id="course-select">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No pre-selected course</SelectItem>
                {courses?.filter(course => course.status === 'ACTIVE').map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            Pre-select a course for all uploaded certificates
          </p>
        </div>

        {/* Location Selection */}
        <div className="space-y-2">
          <Label htmlFor="location-select">Select Location</Label>
          {isLoadingLocations ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading locations...</span>
            </div>
          ) : (
            <Select
              value={selectedLocationId}
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
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="course-matching"
          checked={enableCourseMatching}
          onCheckedChange={setEnableCourseMatching}
        />
        <Label htmlFor="course-matching">
          Enable automatic course matching
        </Label>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        When enabled, the system will try to match First Aid Level, CPR Level, and Course Length in your roster with available courses.
      </p>
    </div>
  );
}
