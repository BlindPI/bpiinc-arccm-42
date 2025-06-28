
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function Verify() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle>Certificate Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600">
            Enter certificate details to verify authenticity
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
