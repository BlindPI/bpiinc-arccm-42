
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CourseSelector } from '../CourseSelector';
import { LocationSelector } from '../LocationSelector';
import { useBatchUpload } from './BatchCertificateContext';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <div className="bg-white/60 dark:bg-muted/70 rounded-lg p-4 shadow-sm border border-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div>
            <Label htmlFor="auto-match" className="cursor-pointer">
              Enable automatic course matching
            </Label>
            <p className="text-xs text-muted-foreground">
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

      <Collapsible className="border border-muted rounded-md">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex w-full justify-between px-4 py-2">
            <span className="font-medium">Advanced Options</span>
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0 border-t">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fallback Course</Label>
              <CourseSelector
                selectedCourseId={selectedCourseId}
                onCourseSelect={setSelectedCourseId}
                label="Select a fallback course"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Used when automatic matching fails or is disabled
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Location</Label>
              <LocationSelector
                selectedLocationId={selectedLocationId}
                onLocationChange={setSelectedLocationId}
              />
              <p className="text-xs text-muted-foreground">
                Associate certificates with a specific location
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
