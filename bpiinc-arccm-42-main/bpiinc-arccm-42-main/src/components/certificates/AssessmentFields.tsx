
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AssessmentFieldsProps {
  firstAidLevel: string;
  cprLevel: string;
  assessmentStatus: string;
  onFirstAidLevelChange: (value: string) => void;
  onCprLevelChange: (value: string) => void;
  onAssessmentStatusChange: (value: string) => void;
}

export function AssessmentFields({
  firstAidLevel,
  cprLevel,
  assessmentStatus,
  onFirstAidLevelChange,
  onCprLevelChange,
  onAssessmentStatusChange
}: AssessmentFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="firstAidLevel">First Aid Level</Label>
        <Select value={firstAidLevel} onValueChange={onFirstAidLevelChange}>
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
        <Select value={cprLevel} onValueChange={onCprLevelChange}>
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
        <Select value={assessmentStatus} onValueChange={onAssessmentStatusChange}>
          <SelectTrigger id="assessmentStatus">
            <SelectValue placeholder="Select assessment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PASS">Pass</SelectItem>
            <SelectItem value="FAIL">Fail</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
