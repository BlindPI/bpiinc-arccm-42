
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, ChevronLeft, ChevronRight, Users, Crown, Building2, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeamCreation } from './hooks/useTeamCreation';
import { StepBasicInfo } from './steps/StepBasicInfo';
import { StepLocationProvider } from './steps/StepLocationProvider';
import { StepPermissions } from './steps/StepPermissions';
import { StepReview } from './steps/StepReview';

interface UniversalTeamWizardProps {
  userRole?: string;
  onTeamCreated?: (teamId: string) => void;
}

const steps = [
  { title: 'Basic Info', description: 'Team name and type' },
  { title: 'Location & Provider', description: 'Assignment and association' },
  { title: 'Permissions', description: 'Team capabilities' },
  { title: 'Review', description: 'Confirm and create' }
];

export function UniversalTeamWizard({ userRole = 'IT', onTeamCreated }: UniversalTeamWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const {
    formData,
    updateFormData,
    errors,
    validateStep,
    createTeam,
    isCreating,
    resetForm
  } = useTeamCreation();

  // Get location and provider names for review step
  const { data: locationData } = useQuery({
    queryKey: ['location', formData.location_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('name, city, state')
        .eq('id', formData.location_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!formData.location_id
  });

  const { data: providerData } = useQuery({
    queryKey: ['provider', formData.provider_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('name')
        .eq('id', parseInt(formData.provider_id))
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!formData.provider_id
  });

  const getWizardConfig = () => {
    switch (userRole) {
      case 'SA':
        return {
          title: 'System Administrator Team Creation',
          description: 'Create teams with full system privileges and advanced configuration options',
          icon: Crown,
          variant: 'default' as const,
          features: ['Full system access', 'Enterprise features', 'Cross-location teams', 'Advanced governance']
        };
      case 'AD':
        return {
          title: 'Administrator Team Creation',
          description: 'Create and manage teams within your administrative scope',
          icon: Shield,
          variant: 'default' as const,
          features: ['Administrative control', 'Team governance', 'Member management', 'Analytics access']
        };
      case 'AP':
        return {
          title: 'Provider Team Creation',
          description: 'Create teams for your authorized provider organization',
          icon: Building2,
          variant: 'secondary' as const,
          features: ['Provider scope', 'Team management', 'Performance tracking', 'Training coordination']
        };
      default:
        return {
          title: 'Team Creation',
          description: 'Create a new team for collaboration and training',
          icon: Users,
          variant: 'outline' as const,
          features: ['Basic team features', 'Member collaboration', 'Activity tracking', 'Communication tools']
        };
    }
  };

  const config = getWizardConfig();
  const IconComponent = config.icon;

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (validateStep(currentStep)) {
      try {
        const result = await new Promise<{ id: string }>((resolve, reject) => {
          createTeam(undefined, {
            onSuccess: (team) => {
              if (team && typeof team === 'object' && 'id' in team) {
                resolve(team as { id: string });
              } else {
                reject(new Error('Team creation failed'));
              }
            },
            onError: reject
          });
        });
        
        if (result?.id) {
          onTeamCreated?.(result.id);
          setIsOpen(false);
          setCurrentStep(0);
        }
      } catch (error) {
        console.error('Error in handleFinish:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setCurrentStep(0);
    resetForm();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepBasicInfo
            formData={formData}
            onUpdateFormData={updateFormData}
            errors={errors}
          />
        );
      case 1:
        return (
          <StepLocationProvider
            formData={formData}
            onUpdateFormData={updateFormData}
            userRole={userRole}
            errors={errors}
          />
        );
      case 2:
        return (
          <StepPermissions
            formData={formData}
            onUpdateFormData={updateFormData}
            userRole={userRole}
          />
        );
      case 3:
        return (
          <StepReview
            formData={formData}
            locationName={locationData ? `${locationData.name} - ${locationData.city}, ${locationData.state}` : undefined}
            providerName={providerData?.name}
          />
        );
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={config.variant}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={config.variant}>
              {userRole}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {config.description}
            </span>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step, index) => (
                <div key={index} className={`text-center ${index === currentStep ? 'text-primary font-medium' : ''}`}>
                  <div>{step.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Team'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
