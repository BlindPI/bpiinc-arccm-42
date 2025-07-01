// File: src/components/compliance/FormRequirement.tsx

import React, { useState, useEffect } from 'react';
import { useRequirementSubmission } from '../../hooks/useComplianceRequirements';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

// UI Components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Loader2 } from 'lucide-react';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
}

interface FormRequirementProps {
  requirement: {
    id: string;
    name: string;
    form_schema?: FormField[];
    validation_rules?: {
      required_fields?: string[];
    };
    ui_state?: {
      form_data?: Record<string, any>;
    };
  };
  onSubmit?: () => void;
  onSave?: () => void;
}

export function FormRequirement({ requirement, onSubmit, onSave }: FormRequirementProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { mutate: submitRequirement } = useRequirementSubmission();
  
  // Initialize form with existing data if available
  useEffect(() => {
    if (requirement.ui_state?.form_data) {
      setFormData(requirement.ui_state.form_data);
    }
  }, [requirement.ui_state?.form_data]);
  
  // Get form schema - either from the requirement or create a default one based on required_fields
  const formSchema = requirement.form_schema || 
    (requirement.validation_rules?.required_fields || []).map(field => ({
      id: field,
      type: 'text',
      label: field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      required: true
    }));
  
  const handleChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear error when field is updated
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Check required fields
    formSchema.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        newErrors[field.id] = `${field.label} is required`;
        isValid = false;
      }
      
      // Additional validation based on field type and validation rules
      if (formData[field.id] && field.validation) {
        if (field.type === 'number') {
          const value = Number(formData[field.id]);
          
          if (field.validation.min !== undefined && value < field.validation.min) {
            newErrors[field.id] = `Value must be at least ${field.validation.min}`;
            isValid = false;
          }
          
          if (field.validation.max !== undefined && value > field.validation.max) {
            newErrors[field.id] = `Value must be at most ${field.validation.max}`;
            isValid = false;
          }
        }
        
        if (field.type === 'text' && field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(formData[field.id])) {
            newErrors[field.id] = field.validation.errorMessage || 'Invalid format';
            isValid = false;
          }
        }
      }
    });
    
    // Check if all required fields from validation_rules are present
    requirement.validation_rules?.required_fields?.forEach(field => {
      if (!formData[field] || formData[field] === '') {
        newErrors[field] = `${field} is required`;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to submit requirements');
      return;
    }
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit requirement
      submitRequirement({
        userId: user.id,
        requirementId: requirement.id,
        submissionData: {
          form_data: formData,
          submittedAt: new Date().toISOString()
        }
      }, {
        onSuccess: () => {
          toast.success('Requirement submitted successfully');
          onSubmit?.();
        },
        onError: (error) => {
          console.error('Submission error:', error);
          toast.error('Failed to submit requirement. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveDraft = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to save drafts');
      return;
    }
    
    try {
      await supabase
        .from('user_compliance_records')
        .update({
          ui_state: {
            expanded: true,
            form_data: formData,
            last_saved: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('requirement_id', requirement.id);
      
      toast.success('Draft saved successfully');
      onSave?.();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft. Please try again.');
    }
  };
  
  // Render appropriate form field based on type
  const renderFormField = (field: FormField) => {
    const { id, type, label, required, placeholder, options, validation } = field;
    
    switch (type) {
      case 'text':
        return (
          <div key={id} className="space-y-2">
            <Label htmlFor={id} className="flex">
              {label} {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={id}
              type="text"
              value={formData[id] || ''}
              onChange={(e) => handleChange(id, e.target.value)}
              placeholder={placeholder}
              className={errors[id] ? 'border-red-500' : ''}
            />
            {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
          </div>
        );
        
      case 'textarea':
        return (
          <div key={id} className="space-y-2">
            <Label htmlFor={id} className="flex">
              {label} {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={id}
              value={formData[id] || ''}
              onChange={(e) => handleChange(id, e.target.value)}
              placeholder={placeholder}
              className={errors[id] ? 'border-red-500' : ''}
              rows={4}
            />
            {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
          </div>
        );
        
      case 'number':
        return (
          <div key={id} className="space-y-2">
            <Label htmlFor={id} className="flex">
              {label} {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={id}
              type="number"
              value={formData[id] || ''}
              onChange={(e) => handleChange(id, e.target.value ? Number(e.target.value) : '')}
              placeholder={placeholder}
              className={errors[id] ? 'border-red-500' : ''}
              min={validation?.min}
              max={validation?.max}
            />
            {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
          </div>
        );
        
      case 'date':
        return (
          <div key={id} className="space-y-2">
            <Label htmlFor={id} className="flex">
              {label} {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={id}
              type="date"
              value={formData[id] || ''}
              onChange={(e) => handleChange(id, e.target.value)}
              className={errors[id] ? 'border-red-500' : ''}
            />
            {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
          </div>
        );
        
      case 'select':
        return (
          <div key={id} className="space-y-2">
            <Label htmlFor={id} className="flex">
              {label} {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={formData[id] || ''}
              onValueChange={(value) => handleChange(id, value)}
            >
              <SelectTrigger id={id} className={errors[id] ? 'border-red-500' : ''}>
                <SelectValue placeholder={placeholder || `Select ${label}`} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={id} className="flex items-start space-x-2 py-2">
            <Checkbox
              id={id}
              checked={!!formData[id]}
              onCheckedChange={(checked) => handleChange(id, checked)}
              className={errors[id] ? 'border-red-500' : ''}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor={id} className="flex">
                {label} {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
            </div>
          </div>
        );
        
      case 'radio':
        return (
          <div key={id} className="space-y-2">
            <Label className="flex">
              {label} {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={formData[id] || ''}
              onValueChange={(value) => handleChange(id, value)}
              className="flex flex-col space-y-1"
            >
              {options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
                  <Label htmlFor={`${id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {formSchema.map(renderFormField)}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : 'Submit Requirement'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default FormRequirement;