
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

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
      <div className="mt-2 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2"
        >
          <a 
            href="https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="w-4 h-4" />
            Download Template
          </a>
        </Button>
        <span className="text-sm text-muted-foreground">
          Download the template before submitting your request
        </span>
      </div>
    </CardHeader>
  );
}
