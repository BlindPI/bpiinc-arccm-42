
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { Check, ArrowLeft, ArrowRight, Users, MapPin, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AuthorizedProvider } from '@/services/provider/authorizedProviderService';

interface CreateProviderTeamWizardProps {
  provider: AuthorizedProvider;
  onClose: () => void;
  onSuccess: () => void;
}

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  provider_id: string;
}

const WIZARD_STEPS = [
  { id: 'basic', title: 'Team Details', icon: Users },
  { id: 'location', title: 'Location Assignment', icon: MapPin },
  { id: 'settings', title: 'Team Settings', icon: Settings },
  { id: 'review', title: 'Review & Create', icon: CheckCircle }
];

export function CreateProviderTeamWizard({ provider, onClose, onSuccess }: CreateProviderTeamWizardProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    team_type: 'provider_team',
    location_id: provider.primary_location_id || '',
    provider_id: provider.id
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTeamMutation = useMutation({
    mutationFn: (data: TeamFormData) => teamManagementService.createTeamWithLocation(data),
    onSuccess: () => {
      toast.success('Team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['provider-teams', provider.id] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepIndex) {
      case 0: // Basic details
        if (!formData.name.trim()) {
          newErrors.name = 'Team name is required';
        }
        break;
      case 1: // Location assignment
        if (!formData.location_id) {
          newErrors.location_id = 'Location assignment is required';
        }
        break;
      case 2: // Settings
        // Add any settings validation here
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      createTeamMutation.mutate(formData);
    }
  };

  const updateFormData = (updates: Partial<TeamFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear related errors
    const updatedErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete updatedErrors[key];
    });
    setErrors(updatedErrors);
  };

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Provider Team
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      isActive ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}
                  `}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`h-0.5 w-16 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    placeholder="Enter team name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Describe the team's purpose and responsibilities"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Provider</Label>
                  <Card className="p-3 bg-muted">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">{provider.provider_type}</p>
                      </div>
                      <Badge variant="default">Selected</Badge>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Location Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Primary Location</Label>
                  {provider.primary_location ? (
                    <Card className="p-3 bg-muted">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{provider.primary_location.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.primary_location.city}, {provider.primary_location.state}
                          </p>
                        </div>
                        <Badge variant="default">Auto-assigned</Badge>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-3 border-red-200 bg-red-50">
                      <p className="text-red-600">No location assigned to provider</p>
                      <p className="text-sm text-red-500 mt-1">
                        A location must be assigned to the provider before creating teams.
                      </p>
                    </Card>
                  )}
                  {errors.location_id && <p className="text-sm text-red-500 mt-1">{errors.location_id}</p>}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Location Benefits</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Automatic compliance tracking for location-specific requirements</li>
                    <li>• Streamlined certificate generation with location branding</li>
                    <li>• Location-based performance analytics and reporting</li>
                    <li>• Automated team member assignment workflows</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Team Type</Label>
                  <Card className="p-3 bg-muted">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Provider Team</p>
                        <p className="text-sm text-muted-foreground">
                          Specialized team for authorized provider operations
                        </p>
                      </div>
                      <Badge variant="outline">Default</Badge>
                    </div>
                  </Card>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-2">Default Permissions</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Manage team members and roles</li>
                    <li>• Access location-specific resources</li>
                    <li>• Generate and manage certificates</li>
                    <li>• View performance metrics and reports</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Create</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Team Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {formData.name}</p>
                      <p><strong>Description:</strong> {formData.description || 'No description'}</p>
                      <p><strong>Type:</strong> Provider Team</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Assignment</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Provider:</strong> {provider.name}</p>
                      <p><strong>Location:</strong> {provider.primary_location?.name || 'Not assigned'}</p>
                      <p><strong>Provider Type:</strong> {provider.provider_type}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Next Steps</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Team will be created and you'll be assigned as admin</li>
                    <li>• You can start adding team members immediately</li>
                    <li>• Location-specific settings will be automatically configured</li>
                    <li>• Performance tracking will begin once team is active</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </span>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
