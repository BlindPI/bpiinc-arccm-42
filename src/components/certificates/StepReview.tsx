
import React from 'react';

interface StepReviewProps {
  name: string;
  email: string;
  phone: string;
  company: string;
  selectedCourseId: string;
  firstAidLevel: string;
  cprLevel: string;
  assessmentStatus: string;
  issueDate: string;
  expiryDate: string;
  isValidated: boolean;
  setIsValidated: (v: boolean) => void;
}

export function StepReview({
  name,
  email,
  phone,
  company,
  selectedCourseId,
  firstAidLevel,
  cprLevel,
  assessmentStatus,
  issueDate,
  expiryDate,
  isValidated,
  setIsValidated
}: StepReviewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-gray-800">Review Certificate Details</h2>
      <p className="text-gray-600 text-sm">Please review the information before submitting</p>
      <div className="bg-gray-50 p-6 rounded-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Recipient Information</h3>
            <p className="mt-1">
              <span className="block text-gray-900 font-medium">{name}</span>
              <span className="block text-gray-600">{email}</span>
              <span className="block text-gray-600">{phone}</span>
              <span className="block text-gray-600">{company}</span>
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Course Details</h3>
            <p className="mt-1">
              <span className="block text-gray-900 font-medium">Course ID: {selectedCourseId}</span>
              <span className="block text-gray-600">First Aid Level: {firstAidLevel}</span>
              <span className="block text-gray-600">CPR Level: {cprLevel}</span>
              <span className="block text-gray-600">Assessment: {assessmentStatus}</span>
            </p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Certificate Timeline</h3>
          <div className="grid grid-cols-2 gap-4 mt-1">
            <div>
              <span className="block text-gray-600">Issue Date</span>
              <span className="block text-gray-900">{issueDate}</span>
            </div>
            <div>
              <span className="block text-gray-600">Expiry Date</span>
              <span className="block text-gray-900">{expiryDate}</span>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={isValidated}
              onChange={() => setIsValidated(!isValidated)}
              className="h-4 w-4 text-primary border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">
              I confirm that all information is correct
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
