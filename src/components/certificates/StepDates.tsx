import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface StepDatesProps {
  issueDate: string;
  expiryDate: string;
  setIssueDate: (v: string) => void;
  setExpiryDate: (v: string) => void;
  isExistingRequest?: boolean;
}

export function StepDates({ 
  issueDate, 
  expiryDate, 
  setIssueDate, 
  setExpiryDate,
  isExistingRequest = false
}: StepDatesProps) {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="section-header">Certificate Dates</h2>
        <p className="text-muted-foreground text-sm">
          {isExistingRequest 
            ? "Review the certificate dates from the imported request"
            : "Specify when the certificate was issued and when it expires"}
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="issueDate">Issue Date</Label>
          <div className="relative">
            <Input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
              className="pl-10"
              required
              readOnly={isExistingRequest}
              disabled={isExistingRequest}
            />
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
          {isExistingRequest && (
            <p className="text-xs text-muted-foreground mt-1">
              Issue date from imported request
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <div className="relative">
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="pl-10"
              required
            />
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
