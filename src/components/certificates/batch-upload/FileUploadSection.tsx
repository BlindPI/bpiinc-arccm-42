
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FileUploadSectionProps {
  onFileUpload: (file: File) => Promise<void>;
}

export function FileUploadSection({ onFileUpload }: FileUploadSectionProps) {
  const { 
    enableCourseMatching, 
    setEnableCourseMatching,
    selectedCourseId,
    setSelectedCourseId,
    selectedLocationId,
    setSelectedLocationId,
    isProcessingFile
  } = useBatchUpload();

  const { data: courses, isLoading: isLoadingCourses } = useCourseData();
  const { locations, isLoading: isLoadingLocations } = useLocationData();

  const handleUpload = async (file: File) => {
    await onFileUpload(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/70 dark:bg-secondary/70 border border-card rounded-xl px-6 py-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Upload Your Roster</h3>
          <p className="text-sm text-muted-foreground">
            Start by uploading your roster file (XLSX). The system will automatically
            extract course information and dates when available.
          </p>
        </div>
        
        <FileDropZone 
          onFileSelected={handleUpload} 
          isUploading={isProcessingFile} 
          disabled={isProcessingFile}
        />
        
        <p className="text-xs text-muted-foreground mt-3">
          {isProcessingFile 
            ? 'Processing your roster...' 
            : 'Upload a CSV or XLSX file containing student data. The system will guide you through the next steps after processing your file.'}
        </p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Course Selection */}
        <div className="bg-white/70 dark:bg-secondary/70 border border-card rounded-xl p-5 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="course-select">Pre-select Course (Optional)</Label>
            {isLoadingCourses ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading courses...</span>
              </div>
            ) : (
              <Select
                value={selectedCourseId || "none"}
                onValueChange={setSelectedCourseId}
                disabled={isProcessingFile}
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
        </div>

        {/* Location Selection */}
        <div className="bg-white/70 dark:bg-secondary/70 border border-card rounded-xl p-5 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="location-select">Select Location</Label>
            {isLoadingLocations ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading locations...</span>
              </div>
            ) : (
              <Select
                value={selectedLocationId || "none"}
                onValueChange={setSelectedLocationId}
                disabled={isProcessingFile}
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
      </div>
      
      <div className="bg-white/70 dark:bg-secondary/70 border border-card rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <Switch
            id="course-matching"
            checked={enableCourseMatching}
            onCheckedChange={setEnableCourseMatching}
            disabled={isProcessingFile}
          />
          <Label htmlFor="course-matching">
            Enable automatic course matching
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          When enabled, the system will try to match First Aid Level, CPR Level, and Course Length in your roster with available courses.
        </p>
      </div>
    </div>
  );
}
