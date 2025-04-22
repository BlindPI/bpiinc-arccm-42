
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CourseSelector } from './CourseSelector';
import { AssessmentFields } from './AssessmentFields';
import { BookOpen, Award, HeartPulse } from 'lucide-react';

interface StepCourseDetailsProps {
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  firstAidLevel: string;
  setFirstAidLevel: (value: string) => void;
  cprLevel: string;
  setCprLevel: (value: string) => void;
  assessmentStatus: string;
  setAssessmentStatus: (value: string) => void;
}

export function StepCourseDetails({
  selectedCourseId,
  setSelectedCourseId,
  firstAidLevel,
  setFirstAidLevel,
  cprLevel,
  setCprLevel,
  assessmentStatus,
  setAssessmentStatus
}: StepCourseDetailsProps) {
  const firstAidLevels = [
    { value: 'Basic', label: 'Basic First Aid' },
    { value: 'Standard', label: 'Standard First Aid' },
    { value: 'Advanced', label: 'Advanced First Aid' },
    { value: 'Wilderness', label: 'Wilderness First Aid' },
    { value: 'Professional', label: 'Professional Responder' }
  ];

  const cprLevels = [
    { value: 'A', label: 'CPR A - Adult' },
    { value: 'B', label: 'CPR B - Adult & Child' },
    { value: 'C', label: 'CPR C - Adult, Child & Infant' },
    { value: 'HCP', label: 'CPR HCP - Healthcare Provider' }
  ];

  const assessmentStatuses = [
    { value: 'Pass', label: 'Pass' },
    { value: 'Fail', label: 'Fail' },
    { value: 'Conditional', label: 'Conditional Pass' },
    { value: 'Incomplete', label: 'Incomplete' }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Course Details
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Select the course and certification details
        </p>
      </header>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="courseSelector">Course</Label>
          <CourseSelector
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstAidLevel" className="flex items-center gap-1">
              <Award className="h-4 w-4 text-muted-foreground" />
              First Aid Level
            </Label>
            <Select 
              value={firstAidLevel} 
              onValueChange={setFirstAidLevel}
            >
              <SelectTrigger id="firstAidLevel" className="w-full">
                <SelectValue placeholder="Select First Aid Level" />
              </SelectTrigger>
              <SelectContent>
                {firstAidLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cprLevel" className="flex items-center gap-1">
              <HeartPulse className="h-4 w-4 text-muted-foreground" />
              CPR Level
            </Label>
            <Select 
              value={cprLevel} 
              onValueChange={setCprLevel}
            >
              <SelectTrigger id="cprLevel" className="w-full">
                <SelectValue placeholder="Select CPR Level" />
              </SelectTrigger>
              <SelectContent>
                {cprLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <AssessmentFields
          assessmentStatus={assessmentStatus}
          setAssessmentStatus={setAssessmentStatus}
          assessmentStatuses={assessmentStatuses}
        />
      </div>
    </div>
  );
}
