
import React from 'react';
import { CertificateFormFields } from './CertificateFormFields';

interface StepCourseDetailsProps {
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
  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  setCompany: (v: string) => void;
  setFirstAidLevel: (v: string) => void;
  setCprLevel: (v: string) => void;
  setAssessmentStatus: (v: string) => void;
  setSelectedCourseId: (v: string) => void;
  setIssueDate: (v: string) => void;
  setExpiryDate: (v: string) => void;
  setIsValidated: (v: boolean) => void;
}

export function StepCourseDetails(props: StepCourseDetailsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-gray-800">Course Details</h2>
      <p className="text-gray-600 text-sm">Select the course and provide certification details</p>
      <CertificateFormFields
        {...props}
        onNameChange={props.setName}
        onEmailChange={props.setEmail}
        onPhoneChange={props.setPhone}
        onCompanyChange={props.setCompany}
        onFirstAidLevelChange={props.setFirstAidLevel}
        onCprLevelChange={props.setCprLevel}
        onAssessmentStatusChange={props.setAssessmentStatus}
        onCourseSelect={props.setSelectedCourseId}
        onIssueDateChange={props.setIssueDate}
        onExpiryDateChange={props.setExpiryDate}
        onValidationChange={props.setIsValidated}
        hideRecipientFields={true}
        hideDateFields={true}
      />
    </div>
  );
}
