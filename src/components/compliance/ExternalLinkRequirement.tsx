// File: src/components/compliance/ExternalLinkRequirement.tsx

import React, { useState } from 'react';
import { useRequirementSubmission } from '../../hooks/useComplianceRequirements';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// UI Components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Loader2, ExternalLink, Upload, CheckCircle } from 'lucide-react';

interface ExternalLinkRequirementProps {
  requirement: {
    id: string;
    name: string;
    description: string;
    external_url?: string;
    external_system?: string;
    validation_rules?: {
      min_score?: number;
      completion_evidence_required?: boolean;
    }
  };
  onSubmit?: () => void;
}

export function ExternalLinkRequirement({ requirement, onSubmit }: ExternalLinkRequirementProps) {
  const { user } = useAuth();
  const [score, setScore] = useState<string>('');
  const [completionCode, setCompletionCode] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { submitRequirement } = useRequirementSubmission();
  
  const validateSubmission = (): boolean => {
    // Check minimum score if required
    if (requirement.validation_rules?.min_score) {
      const numScore = parseFloat(score);
      
      if (isNaN(numScore)) {
        setValidationError('Please enter a valid score');
        return false;
      }
      
      if (numScore < requirement.validation_rules.min_score) {
        setValidationError(`Score must be at least ${requirement.validation_rules.min_score}`);
        return false;
      }
    }
    
    // Check completion code if required
    if (requirement.validation_rules?.completion_evidence_required && !completionCode.trim()) {
      setValidationError('Completion code or certificate ID is required');
      return false;
    }
    
    // Clear any existing errors if validation passes
    setValidationError(null);
    return true;
  };
  
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to submit requirements');
      return;
    }
    
    if (!validateSubmission()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit requirement with proper structure
      await submitRequirement({
        userId: user.id,
        requirementId: requirement.id,
        submissionData: {
          score: score ? parseFloat(score) : undefined,
          completion_code: completionCode,
          completion_date: completionDate,
          notes,
          external_system: requirement.external_system,
          submittedAt: new Date().toISOString()
        }
      });
      
      toast.success('External completion verification submitted successfully');
      onSubmit?.();
    } catch (error) {
      console.error('Error submitting external requirement:', error);
      toast.error('Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenExternalSystem = () => {
    if (requirement.external_url) {
      window.open(requirement.external_url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('External URL not configured for this requirement');
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-base text-blue-800">{requirement.name}</CardTitle>
        <CardDescription>{requirement.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <div className="bg-blue-50 p-4 rounded-md flex items-start space-x-3">
          <ExternalLink className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              External System: {requirement.external_system || 'Training Platform'}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              This requirement must be completed in an external system. Complete the required training 
              or certification, then return here to submit your completion evidence.
            </p>
            <Button 
              onClick={handleOpenExternalSystem} 
              variant="outline" 
              className="mt-3"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open External System
            </Button>
          </div>
        </div>
        
        {validationError && (
          <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm">
            {validationError}
          </div>
        )}
        
        <div className="space-y-4 pt-2">
          {requirement.validation_rules?.min_score !== undefined && (
            <div className="space-y-2">
              <Label htmlFor="score" className="flex">
                Score <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="score"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder={`Enter your score (minimum: ${requirement.validation_rules.min_score})`}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Enter the final score you received for this training or certification
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="completion-code" className="flex">
              Completion Code/Certificate ID
              {requirement.validation_rules?.completion_evidence_required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <Input
              id="completion-code"
              type="text"
              value={completionCode}
              onChange={(e) => setCompletionCode(e.target.value)}
              placeholder="Enter the completion code or certificate ID"
            />
            <p className="text-xs text-muted-foreground">
              This is usually provided upon successful completion of the training
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="completion-date">Completion Date</Label>
            <Input
              id="completion-date"
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information about your completion"
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
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Completion
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ExternalLinkRequirement;
