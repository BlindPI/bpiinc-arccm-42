
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Building2, 
  Users, 
  Plus,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowStep {
  step: number;
  title: string;
  completed: boolean;
  data?: any;
}

export function LocationProviderTeamWorkflow() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowData, setWorkflowData] = useState({
    locationId: '',
    providerId: '',
    teamName: '',
    teamDescription: ''
  });

  // Get locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get available AP users (those with authorized provider records)
  const { data: availableProviders = [] } = useQuery({
    queryKey: ['available-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select(`
          *,
          profiles!inner(*)
        `)
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get existing teams for selected location
  const { data: existingTeams = [] } = useQuery({
    queryKey: ['location-teams', workflowData.locationId],
    queryFn: async () => {
      if (!workflowData.locationId) return [];
      
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members(count)
        `)
        .eq('location_id', workflowData.locationId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!workflowData.locationId
  });

  // Assign provider to location
  const assignProviderMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('authorized_providers')
        .update({ primary_location_id: workflowData.locationId })
        .eq('id', workflowData.providerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Provider assigned to location successfully');
      setCurrentStep(3);
      queryClient.invalidateQueries({ queryKey: ['available-providers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to assign provider: ${error.message}`);
    }
  });

  // Create team
  const createTeamMutation = useMutation({
    mutationFn: async () => {
      // First create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: workflowData.teamName,
          description: workflowData.teamDescription,
          location_id: workflowData.locationId,
          provider_id: workflowData.providerId,
          team_type: 'operational',
          status: 'active'
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add the provider as a team admin
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: workflowData.providerId,
          role: 'ADMIN',
          status: 'active'
        });

      if (memberError) throw memberError;

      return team;
    },
    onSuccess: () => {
      toast.success('Team created and provider assigned successfully');
      setCurrentStep(4);
      queryClient.invalidateQueries({ queryKey: ['location-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  const steps: WorkflowStep[] = [
    {
      step: 1,
      title: 'Select Location',
      completed: !!workflowData.locationId
    },
    {
      step: 2,
      title: 'Assign Provider',
      completed: !!workflowData.providerId && currentStep > 2
    },
    {
      step: 3,
      title: 'Create Team',
      completed: currentStep > 3
    },
    {
      step: 4,
      title: 'Complete',
      completed: currentStep === 4
    }
  ];

  const canProceedToStep2 = workflowData.locationId;
  const canProceedToStep3 = workflowData.locationId && workflowData.providerId;
  const canCreateTeam = workflowData.teamName && workflowData.teamDescription;

  const resetWorkflow = () => {
    setCurrentStep(1);
    setWorkflowData({
      locationId: '',
      providerId: '',
      teamName: '',
      teamDescription: ''
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Three-Click Location → Provider → Team Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.step 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? <CheckCircle className="h-5 w-5" /> : step.step}
                </div>
                <div className="ml-2 text-sm">
                  <div className={`font-medium ${step.completed ? 'text-green-600' : 'text-gray-900'}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Location */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Step 1: Select Location
              </h3>
              <Select value={workflowData.locationId} onValueChange={(value) => setWorkflowData({...workflowData, locationId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{location.name}</span>
                        <span className="text-muted-foreground">({location.city}, {location.state})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {workflowData.locationId && (
                <div className="mt-4">
                  <Button onClick={() => setCurrentStep(2)} disabled={!canProceedToStep2}>
                    Continue to Provider Assignment
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Assign Provider */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Step 2: Assign Authorized Provider
              </h3>
              
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  Selected Location: <strong>{locations.find(l => l.id === workflowData.locationId)?.name}</strong>
                </p>
              </div>

              <Select value={workflowData.providerId} onValueChange={(value) => setWorkflowData({...workflowData, providerId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an authorized provider..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.filter(p => !p.primary_location_id || p.primary_location_id === workflowData.locationId).map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{provider.name}</span>
                        <Badge variant="outline">AP</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {workflowData.providerId && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => assignProviderMutation.mutate()} disabled={!canProceedToStep3 || assignProviderMutation.isPending}>
                    {assignProviderMutation.isPending ? 'Assigning...' : 'Assign Provider'}
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Create Team */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Users className="h-5 w-5" />
                Step 3: Create Team
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded border border-green-200">
                <div>
                  <p className="text-sm text-green-800">
                    <strong>Location:</strong> {locations.find(l => l.id === workflowData.locationId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-800">
                    <strong>Provider:</strong> {availableProviders.find(p => p.id === workflowData.providerId)?.name}
                  </p>
                </div>
              </div>

              {existingTeams.length > 0 && (
                <div className="p-4 bg-amber-50 rounded border border-amber-200">
                  <h4 className="font-medium text-amber-800 mb-2">Existing Teams at this Location:</h4>
                  <div className="space-y-1">
                    {existingTeams.map((team) => (
                      <div key={team.id} className="text-sm text-amber-700">
                        • {team.name} ({team.team_members?.[0]?.count || 0} members)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Team Name</label>
                  <Input
                    value={workflowData.teamName}
                    onChange={(e) => setWorkflowData({...workflowData, teamName: e.target.value})}
                    placeholder="Enter team name..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Team Description</label>
                  <Input
                    value={workflowData.teamDescription}
                    onChange={(e) => setWorkflowData({...workflowData, teamDescription: e.target.value})}
                    placeholder="Enter team description..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => createTeamMutation.mutate()} 
                  disabled={!canCreateTeam || createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-600">Workflow Complete!</h3>
              <p className="text-gray-600">
                Successfully created team "{workflowData.teamName}" with provider assignment.
              </p>
              <Button onClick={resetWorkflow}>
                Start New Workflow
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
