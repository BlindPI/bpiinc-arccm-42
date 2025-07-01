
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';
import { 
  UserCheck, 
  MapPin, 
  Building2, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { APUserSelector } from './workflow/APUserSelector';
import { LocationSelector } from './workflow/LocationSelector';
import { TeamCreationOptions } from './workflow/TeamCreationOptions';
import { RelationshipConfirmation } from './workflow/RelationshipConfirmation';

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  canProceed: boolean;
}

export interface WorkflowData {
  apUserId?: string;
  locationId?: string;
  providerName?: string;
  teamName?: string;
  createProvider: boolean;
  createTeam: boolean;
}

export function APProviderAssignmentWorkflow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    createProvider: true,
    createTeam: true
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const steps: WorkflowStep[] = [
    {
      id: 'ap-user',
      title: 'Select AP User',
      description: 'Choose an Authorized Provider user to assign',
      icon: <UserCheck className="h-5 w-5" />,
      completed: !!workflowData.apUserId,
      canProceed: !!workflowData.apUserId
    },
    {
      id: 'location',
      title: 'Select Location',
      description: 'Choose the location for this provider',
      icon: <MapPin className="h-5 w-5" />,
      completed: !!workflowData.locationId,
      canProceed: !!workflowData.locationId && !!workflowData.apUserId
    },
    {
      id: 'team-options',
      title: 'Team Setup',
      description: 'Configure provider team and naming',
      icon: <Users className="h-5 w-5" />,
      completed: !!workflowData.providerName,
      canProceed: !!workflowData.providerName && !!workflowData.locationId
    },
    {
      id: 'confirmation',
      title: 'Confirm & Create',
      description: 'Review and create the provider relationship',
      icon: <CheckCircle className="h-5 w-5" />,
      completed: false,
      canProceed: !!workflowData.providerName && !!workflowData.locationId && !!workflowData.apUserId
    }
  ];

  // Validate current step data when it changes
  const validateCurrentStep = async () => {
    if (!workflowData.apUserId || !workflowData.locationId) return;

    try {
      const validation = await providerRelationshipService.validateRelationship({
        apUserId: workflowData.apUserId,
        locationId: workflowData.locationId
      });

      if (validation.conflicts.length > 0) {
        setValidationErrors(validation.conflicts.map(c => c.message));
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  React.useEffect(() => {
    if (currentStep >= 1) {
      validateCurrentStep();
    }
  }, [workflowData.apUserId, workflowData.locationId, currentStep]);

  const createRelationshipMutation = useMutation({
    mutationFn: async () => {
      if (!workflowData.apUserId || !workflowData.locationId || !user?.id) {
        throw new Error('Missing required data');
      }

      return providerRelationshipService.createCompleteRelationship(
        workflowData.apUserId,
        workflowData.locationId,
        user.id,
        {
          createProvider: workflowData.createProvider,
          providerName: workflowData.providerName,
          createTeam: workflowData.createTeam,
          teamName: workflowData.teamName
        }
      );
    },
    onSuccess: () => {
      toast.success('Provider relationship created successfully!');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ap-users'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      
      // Reset workflow
      setCurrentStep(0);
      setWorkflowData({ createProvider: true, createTeam: true });
      setValidationErrors([]);
    },
    onError: (error: any) => {
      toast.error(`Failed to create relationship: ${error.message}`);
    }
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1 && steps[currentStep].canProceed) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep || steps[stepIndex - 1]?.completed) {
      setCurrentStep(stepIndex);
    }
  };

  const handleComplete = () => {
    if (steps[currentStep].canProceed) {
      createRelationshipMutation.mutate();
    }
  };

  const updateWorkflowData = (updates: Partial<WorkflowData>) => {
    setWorkflowData(prev => ({ ...prev, ...updates }));
  };

  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            AP Provider Assignment Workflow
          </CardTitle>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="w-full" />
            
            {/* Step Navigation */}
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${
                    index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index < currentStep || step.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  disabled={index > currentStep && !steps[index - 1]?.completed}
                >
                  <div className="flex items-center gap-2">
                    {step.icon}
                    {step.completed && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Relationship Conflicts Detected:</div>
              {validationErrors.map((error, index) => (
                <div key={index} className="text-sm">• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 0 && (
            <APUserSelector
              selectedUserId={workflowData.apUserId}
              onSelect={(apUserId) => updateWorkflowData({ apUserId })}
            />
          )}
          
          {currentStep === 1 && (
            <LocationSelector
              selectedLocationId={workflowData.locationId}
              onSelect={(locationId) => updateWorkflowData({ locationId })}
              excludeAssigned={true}
            />
          )}
          
          {currentStep === 2 && (
            <TeamCreationOptions
              providerName={workflowData.providerName}
              teamName={workflowData.teamName}
              createProvider={workflowData.createProvider}
              createTeam={workflowData.createTeam}
              onUpdate={updateWorkflowData}
            />
          )}
          
          {currentStep === 3 && (
            <RelationshipConfirmation
              workflowData={workflowData}
              validationErrors={validationErrors}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!steps[currentStep].canProceed || validationErrors.length > 0}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!steps[currentStep].canProceed || validationErrors.length > 0 || createRelationshipMutation.isPending}
            >
              {createRelationshipMutation.isPending ? 'Creating...' : 'Create Relationship'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
