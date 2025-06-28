// File: src/components/compliance/FormRequirement.tsx

import React, { useState } from 'react';
import { useRequirementSubmission } from '../../hooks/useComplianceRequirements';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// UI Components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Loader2, ListChecks } from 'lucide-react';

interface FormRequirementProps {
  requirement: {
    id: string;
    name: string;
    description: string;
    form_fields: {
      id: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
    }[];
  };
  onSubmit?: () => void;
}

export function FormRequirement({ requirement, onSubmit }: FormRequirementProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { submitRequirement } = useRequirementSubmission();
  
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to submit requirements');
      return;
    }
    
    try {
      // Submit requirement with proper structure
      await submitRequirement({
        userId: user.id,
        requirementId: requirement.id,
        submissionData: {
          form_data: formData,
          notes,
          submittedAt: new Date().toISOString()
        }
      });
      
      toast.success('Form requirement submitted successfully');
      onSubmit?.();
    } catch (error) {
      console.error('Error submitting form requirement:', error);
      toast.error('Failed to submit form. Please try again.');
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-base text-blue-800">{requirement.name}</CardTitle>
        <CardDescription>{requirement.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-4">
          {requirement.form_fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className={field.required ? 'flex' : ''}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === 'text' && (
                <Input
                  type="text"
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  required={field.required}
                />
              )}
              {field.type === 'textarea' && (
                <Textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  required={field.required}
                  rows={4}
                />
              )}
              {field.type === 'select' && field.options && (
                <select
                  id={field.id}
                  className="w-full border rounded-md py-2 px-3"
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  required={field.required}
                >
                  <option value="">Select an option</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information about this submission"
              rows={3}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 border-t px-6 py-4">
        <div className="w-full flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ListChecks className="h-4 w-4 mr-2" />
                Submit Form
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
