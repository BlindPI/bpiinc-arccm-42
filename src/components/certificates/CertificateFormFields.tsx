
import React from 'react';
import { RecipientFields } from './RecipientFields';
import { AssessmentFields } from './AssessmentFields';
import { CourseSelector } from './CourseSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValidationChecklist } from './ValidationChecklist';

interface CertificateFormFieldsProps {
  name: string;
  email: string;
  phone: string;
  company: string;
  firstAidLevel: string;
  cprLevel: string;
  assessmentStatus: string;
  selectedCourseId: string;
  issueDate: string;
  expiryDate: string;
  isValidated: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onFirstAidLevelChange: (value: string) => void;
  onCprLevelChange: (value: string) => void;
  onAssessmentStatusChange: (value: string) => void;
  onCourseSelect: (value: string) => void;
  onIssueDateChange: (value: string) => void;
  onValidationChange: (value: boolean) => void;
}

export function CertificateFormFields({
  name,
  email,
  phone,
  company,
  firstAidLevel,
  cprLevel,
  assessmentStatus,
  selectedCourseId,
  issueDate,
  expiryDate,
  isValidated,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onCompanyChange,
  onFirstAidLevelChange,
  onCprLevelChange,
  onAssessmentStatusChange,
  onCourseSelect,
  onIssueDateChange,
  onValidationChange,
}: CertificateFormFieldsProps) {
  return (
    <>
      <RecipientFields
        name={name}
        email={email}
        phone={phone}
        company={company}
        onNameChange={onNameChange}
        onEmailChange={onEmailChange}
        onPhoneChange={onPhoneChange}
        onCompanyChange={onCompanyChange}
      />
      
      <AssessmentFields
        firstAidLevel={firstAidLevel}
        cprLevel={cprLevel}
        assessmentStatus={assessmentStatus}
        onFirstAidLevelChange={onFirstAidLevelChange}
        onCprLevelChange={onCprLevelChange}
        onAssessmentStatusChange={onAssessmentStatusChange}
      />
      
      <CourseSelector 
        selectedCourseId={selectedCourseId}
        onCourseSelect={onCourseSelect}
      />
      
      <div className="space-y-2">
        <Label htmlFor="issueDate">Issue Date</Label>
        <Input
          id="issueDate"
          type="text"
          value={issueDate}
          onChange={(e) => onIssueDateChange(e.target.value)}
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
      
      <ValidationChecklist onValidationChange={onValidationChange} />
    </>
  );
}
