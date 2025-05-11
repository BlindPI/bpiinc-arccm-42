
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CourseSelector } from '../CourseSelector';
import { LocationSelector } from '../LocationSelector';
import { useBatchUpload } from './BatchCertificateContext';

export function SelectCourseSection() {
  const {
    selectedCourseId,
    setSelectedCourseId,
    selectedLocationId,
    setSelectedLocationId,
    enableCourseMatching,
    setEnableCourseMatching,
    extractedCourse,
    hasCourseMatches
  } = useBatchUpload();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-1/2 space-y-4">
          <CourseSelector
            selectedCourseId={selectedCourseId}
            onCourseSelect={setSelectedCourseId}
            label="Default Course"
            className="w-full"
          />
          
          <LocationSelector
            selectedLocationId={selectedLocationId}
            onLocationSelect={setSelectedLocationId}
          />
        </div>
        
        <div className="w-full md:w-1/2 space-y-4 bg-white/60 dark:bg-muted/70 rounded-lg p-4 shadow-sm border border-muted/30">
          <h3 className="text-lg font-medium">Course Matching</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-match" className="cursor-pointer">
                Enable automatic course matching
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Match courses based on First Aid and CPR levels in your file
              </p>
            </div>
            <Switch
              id="auto-match"
              checked={enableCourseMatching}
              onCheckedChange={setEnableCourseMatching}
            />
          </div>
          
          {enableCourseMatching && extractedCourse && (
            <div className="mt-4 bg-accent/30 border border-accent/40 p-3 rounded-md">
              <h4 className="text-sm font-medium">Extracted Course Info</h4>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                {extractedCourse.firstAidLevel && (
                  <div>
                    <span className="text-muted-foreground">First Aid Level:</span>
                    <span className="ml-1 font-medium">{extractedCourse.firstAidLevel}</span>
                  </div>
                )}
                {extractedCourse.cprLevel && (
                  <div>
                    <span className="text-muted-foreground">CPR Level:</span>
                    <span className="ml-1 font-medium">{extractedCourse.cprLevel}</span>
                  </div>
                )}
                {extractedCourse.length && (
                  <div>
                    <span className="text-muted-foreground">Length:</span>
                    <span className="ml-1 font-medium">{extractedCourse.length} hours</span>
                  </div>
                )}
              </div>
              {hasCourseMatches && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  Course matches found in the data!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
