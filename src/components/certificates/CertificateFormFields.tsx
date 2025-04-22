
import React from 'react';
import { CourseSelector } from './CourseSelector';
import { RecipientFields } from './RecipientFields';
import { AssessmentFields } from './AssessmentFields';
import { DateInputs } from './DateInputs';
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
  onExpiryDateChange: (value: string) => void;
  onValidationChange: (value: boolean) => void;
  hideRecipientFields?: boolean;
  hideDateFields?: boolean;
}

export const CertificateFormFields: React.FC<CertificateFormFieldsProps> = ({
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
  onExpiryDateChange,
  onValidationChange,
  hideRecipientFields = false,
  hideDateFields = false
}) => {
  return (
    <div className="space-y-6">
      {!hideRecipientFields && (
        <>
          <h3 className="text-lg font-medium text-gray-900">Recipient Information</h3>
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
        </>
      )}

      <CourseSelector
        selectedCourseId={selectedCourseId}
        onCourseSelect={onCourseSelect}
      />

      <AssessmentFields
        firstAidLevel={firstAidLevel}
        cprLevel={cprLevel}
        assessmentStatus={assessmentStatus}
        onFirstAidLevelChange={onFirstAidLevelChange}
        onCprLevelChange={onCprLevelChange}
        onAssessmentStatusChange={onAssessmentStatusChange}
      />

      {!hideDateFields && (
        <DateInputs
          issueDate={issueDate}
          expiryDate={expiryDate}
          onIssueDateChange={onIssueDateChange}
          onExpiryDateChange={onExpiryDateChange}
        />
      )}

      <ValidationChecklist
        name={name}
        email={email}
        selectedCourseId={selectedCourseId}
        issueDate={issueDate}
        expiryDate={expiryDate}
        isValidated={isValidated}
        onValidationChange={onValidationChange}
      />
    </div>
  );
};
