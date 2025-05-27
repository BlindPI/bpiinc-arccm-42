
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, ArrowLeft, ArrowRight, Users, MapPin, Settings, CheckCircle } from 'lucide-react';

interface UniversalTeamWizardProps {
  userRole: string;
  onTeamCreated?: () => void;
}

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  provider_id: string;
  metadata: Record<string, any>;
}

const STEPS = [
  { id: 1, title: 'Team Details', icon: Users },
  { id: 2, title: 'Location Assignment', icon: MapPin },
  { id: 3, title: 'Team Settings', icon: Settings },
  { id: 4, title: 'Review & Create', icon: CheckCircle }
];

export function UniversalTeamWizard({ userRole, onTeamCreated }: UniversalTeamWizardProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    team_type: 'operational',
    location_id: 'no-location',
    provider_id: 'no-provider',
    metadata: {}
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('status', 'APPROVED')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: userRole === 'SA' || userRole === 'AD'
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!formData.name.trim()) throw new Error('Team name is required');

      let finalTeamType = formData.team_type;
      if (userRole === 'AP') finalTeamType = 'provider_team';
      else if (['IC', 'IP', 'IT'].includes(userRole)) finalTeamType = 'instructor_team';

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          team_type: finalTeamType,
          location_id: formData.location_id === 'no-location' ? null : formData.location_id,
          provider_id: formData.provider_id === 'no-provider' ? null : parseInt(formData.provider_id),
          status: 'active',
          performance_score: 0,
          metadata: { 
            ...formData.metadata,
            created_by_role: userRole,
            wizard_version: '2.0'
          },
          current_metrics: {},
          monthly_targets: {},
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'ADMIN',
          permissions: { admin: true, manage_members: true },
          assignment_start_date: new Date().toISOString(),
          team_position: 'Team Creator'
        });

      if (memberError) throw memberError;
      
      return team;
    },
    onSuccess: () => {
      toast.success('Team created successfully!');
      handleClose();
      onTeamCreated?.();
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  const handleClose = () => {
    setOpen(false);
    setCurrentStep(1);
    setFormData({
      name: '',
      description: '',
      team_type: 'operational',
      location_id: 'no-location',
      provider_id: 'no-provider',
      metadata: {}
    });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    createTeamMutation.mutate();
  };

  const getTeamTypeOptions = () => {
    const baseOptions = [
      { value: 'operational', label: 'Operational Team' },
      { value: 'training', label: 'Training Team' },
      { value: 'project', label: 'Project Team' }
    ];

    if (userRole === 'SA' || userRole === 'AD') {
      baseOptions.push(
        { value: 'provider_team', label: 'Provider Team' },
        { value: 'instructor_team', label: 'Instructor Team' },
        { value: 'admin_team', label: 'Admin Team' }
      );
    } else if (userRole === 'AP') {
      baseOptions.push({ value: 'provider_team', label: 'Provider Team' });
    } else if (['IC', 'IP', 'IT'].includes(userRole)) {
      baseOptions.push({ value: 'instructor_team', label: 'Instructor Team' });
    }

    return baseOptions;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
      case 3:
        return true;
      case 4:
        return formData.name.trim().length > 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter team description (optional)"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="team_type">Team Type</Label>
              <Select 
                value={formData.team_type} 
                onValueChange={(value) => setFormData({ ...formData, team_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team type" />
                </SelectTrigger>
                <SelectContent>
                  {getTeamTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Primary Location</Label>
              <Select 
                value={formData.location_id} 
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-location">No specific location</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} {location.city && `• ${location.city}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Select the primary location where this team operates
              </p>
            </div>

            {(userRole === 'SA' || userRole === 'AD') && providers.length > 0 && (
              <div>
                <Label htmlFor="provider">Authorized Provider</Label>
                <Select 
                  value={formData.provider_id} 
                  onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-provider">No provider assignment</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id.toString()}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Optionally assign this team to an authorized provider
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Performance Tracking</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      onChange={(e) => setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, performance_tracking: e.target.checked }
                      })}
                    />
                    <span className="text-sm">Enable performance metrics</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      onChange={(e) => setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, auto_reports: e.target.checked }
                      })}
                    />
                    <span className="text-sm">Automated reports</span>
                  </label>
                </div>
              </div>
              
              <div>
                <Label>Team Features</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      onChange={(e) => setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, member_invites: e.target.checked }
                      })}
                    />
                    <span className="text-sm">Member invitations</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      onChange={(e) => setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, notifications: e.target.checked }
                      })}
                    />
                    <span className="text-sm">Team notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review Team Details</h3>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Name:</span> {formData.name}
                  </div>
                  {formData.description && (
                    <div>
                      <span className="font-medium">Description:</span> {formData.description}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Type:</span> {
                      getTeamTypeOptions().find(opt => opt.value === formData.team_type)?.label
                    }
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {
                      formData.location_id === 'no-location' 
                        ? 'No specific location'
                        : locations.find(loc => loc.id === formData.location_id)?.name || 'Unknown'
                    }
                  </div>
                  {formData.provider_id !== 'no-provider' && providers.length > 0 && (
                    <div>
                      <span className="font-medium">Provider:</span> {
                        providers.find(p => p.id.toString() === formData.provider_id)?.name || 'Unknown'
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground">
              You will be added as the team administrator and can invite other members after creation.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Team
          </DialogTitle>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isActive
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground text-muted-foreground'
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                </div>
                <div className="ml-2 hidden sm:block">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handlePrevious}
          >
            {currentStep === 1 ? 'Cancel' : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </>
            )}
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createTeamMutation.isPending || !canProceed()}
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
