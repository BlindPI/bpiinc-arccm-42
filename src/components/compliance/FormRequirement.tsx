
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRequirementSubmission } from '@/hooks/useComplianceRequirements';

interface FormRequirementProps {
  requirement: {
    id: string;
    name: string;
    form_fields?: any[];
  };
  userId: string;
}

export function FormRequirement({ requirement, userId }: FormRequirementProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { submitRequirement } = useRequirementSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitRequirement({
        userId,
        requirementId: requirement.id,
        submissionData: formData
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{requirement.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {requirement.form_fields?.map((field: any, index: number) => (
            <div key={index}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type || 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                />
              )}
            </div>
          ))}
          <Button type="submit">Submit Form</Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Default export for compatibility
export default FormRequirement;
