
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AcceptInvitation() {
  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Invitation feature is being implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
