
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StepReviewProps {
  data: any;
  onChange: (data: any) => void;
}

export function StepReview({ data }: StepReviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Team Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <strong>Name:</strong> {data.name || 'Not specified'}
          </div>
          <div>
            <strong>Description:</strong> {data.description || 'Not specified'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
