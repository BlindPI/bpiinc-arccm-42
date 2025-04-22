
import React from 'react';

interface StepDatesProps {
  issueDate: string;
  expiryDate: string;
  setIssueDate: (v: string) => void;
  setExpiryDate: (v: string) => void;
}

export function StepDates({ issueDate, expiryDate, setIssueDate, setExpiryDate }: StepDatesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-gray-800">Certificate Dates</h2>
      <p className="text-gray-600 text-sm">Specify when the certificate was issued and when it expires</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
          <input
            type="date"
            value={issueDate}
            onChange={e => setIssueDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}
