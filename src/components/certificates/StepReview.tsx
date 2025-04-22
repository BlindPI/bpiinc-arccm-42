
import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from "lucide-react";

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
    <div className="space-y-6">
      <header>
        <h2 className="section-header flex items-center gap-2">
          <Check className="h-5 w-5 text-primary" />
          Review Certificate Details
        </h2>
        <p className="text-muted-foreground text-sm">Review before submitting. Only submit if all information is correct.</p>
      </header>

      <Card className="bg-card-gradient">
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Recipient</h3>
              <div className="text-base font-medium text-gray-900">{name}</div>
              <div className="text-sm text-muted-foreground">{email}</div>
              <div className="text-sm text-muted-foreground">{phone}</div>
              <div className="text-sm text-muted-foreground">{company}</div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Course Details</h3>
              <div className="text-base font-medium text-gray-900">Course ID: {selectedCourseId}</div>
              <div className="text-sm text-muted-foreground">First Aid Level: {firstAidLevel}</div>
              <div className="text-sm text-muted-foreground">CPR Level: {cprLevel}</div>
              <div className="text-sm text-muted-foreground">Assessment: {assessmentStatus}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-[13px] text-muted-foreground">Issue Date</Label>
              <div className="text-base text-gray-900">{issueDate}</div>
            </div>
            <div>
              <Label className="text-[13px] text-muted-foreground">Expiry Date</Label>
              <div className="text-base text-gray-900">{expiryDate}</div>
            </div>
          </div>
          <div className="pt-6 border-t border-muted">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isValidated}
                onChange={() => setIsValidated(!isValidated)}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                required
              />
              <span className="text-sm text-gray-700">
                I confirm that all information above is correct
              </span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
