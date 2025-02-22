
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FormHeaderProps {
  isAdmin: boolean;
}

export function FormHeader({ isAdmin }: FormHeaderProps) {
  return (
    <CardHeader className="text-left border-b border-border pb-6">
      <CardTitle className="text-2xl font-bold tracking-tight text-primary">
        Certificate Request
      </CardTitle>
      <CardDescription className="mt-2 text-base">
        {isAdmin
          ? 'Generate professional certifications directly for your team'
          : 'Submit your certification request for review and approval'}
      </CardDescription>
    </CardHeader>
  );
}
