
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FormHeaderProps {
  isAdmin: boolean;
}

export function FormHeader({ isAdmin }: FormHeaderProps) {
  return (
    <CardHeader>
      <CardTitle>Certificate Request</CardTitle>
      <CardDescription>
        {isAdmin
          ? 'Generate certificates directly'
          : 'Submit a certificate request for approval'}
      </CardDescription>
    </CardHeader>
  );
}
