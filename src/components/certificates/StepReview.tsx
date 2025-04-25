import React from 'react';
import { useCourseData } from '@/hooks/useCourseData';

interface StepReviewProps {
  recipientName: string;
  email: string;
  phone: string;
  company: string;
  firstAidLevel: string;
  cprLevel: string;
  assessmentStatus: string;
  selectedCourseId: string;
  issueDate: string;
  expiryDate: string;
  city: string;
  province: string;
  postalCode: string;
  isValidated: boolean;
  setIsValidated: (validated: boolean) => void;
  isExistingRequest?: boolean;
}

export function StepReview({
  recipientName,
  email,
  phone,
  company,
  firstAidLevel,
  cprLevel,
  assessmentStatus,
  selectedCourseId,
  issueDate,
  expiryDate,
  city,
  province,
  postalCode,
  isValidated,
  setIsValidated,
  isExistingRequest = false
}: StepReviewProps) {
  const { data: courses } = useCourseData();
  const selectedCourse = courses?.find(course => course.id === selectedCourseId);
  
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Review Certificate Information</h3>
          <p className="text-sm text-muted-foreground">
            {isExistingRequest 
              ? "Review the imported certificate request information below."
              : "Please review the information below before submitting."}
          </p>
        </div>
        
        <div className="grid gap-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Recipient Name:</div>
            <div className="text-sm">{recipientName}</div>
          </div>
          
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Email:</div>
            <div className="text-sm">{email}</div>
          </div>
          
          {phone && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">Phone:</div>
              <div className="text-sm">{phone}</div>
            </div>
          )}
          
          {company && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">Company:</div>
              <div className="text-sm">{company}</div>
            </div>
          )}
          
          {city && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">City:</div>
              <div className="text-sm">{city}</div>
            </div>
          )}
          
          {province && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">Province:</div>
              <div className="text-sm">{province}</div>
            </div>
          )}
          
          {postalCode && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">Postal Code:</div>
              <div className="text-sm">{postalCode}</div>
            </div>
          )}
          
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Course:</div>
            <div className="text-sm">{selectedCourse?.name || selectedCourseId}</div>
          </div>
          
          {firstAidLevel && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">First Aid Level:</div>
              <div className="text-sm">{firstAidLevel}</div>
            </div>
          )}
          
          {cprLevel && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">CPR Level:</div>
              <div className="text-sm">{cprLevel}</div>
            </div>
          )}
          
          {assessmentStatus && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">Assessment Status:</div>
              <div className="text-sm">{assessmentStatus}</div>
            </div>
          )}
          
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Issue Date:</div>
            <div className="text-sm">
              {issueDate}
              {isExistingRequest && (
                <span className="ml-2 text-xs text-muted-foreground">(from imported request)</span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Expiry Date:</div>
            <div className="text-sm">{expiryDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
