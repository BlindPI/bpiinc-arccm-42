import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  MapPin, 
  Building2, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Plus,
  Target
} from 'lucide-react';
import type { 
  ProviderManagementWorkflow, 
  WorkflowStep,
  Location,
  AuthorizedProvider,
  Team 
} from '@/types/provider-management';

interface ThreeClickProviderWorkflowProps {
  onComplete?: () => void;
}

export function ThreeClickProviderWorkflow({ onComplete }: ThreeClickProviderWorkflowProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [workflow, setWorkflow] = useState<ProviderManagementWorkflow>({
    step1: {
      step: 1,
      title: "Select/Create Location",
      description: "Choose an existing location or create a new one",
      completed: false,
      data: null
    },
    step2: {
      step: 2,
      title: "Assign Provider",
      description: "Select or create an authorized provider",
      completed: false,
      data: null
    },
    step3: {
      step: 3,
      title: "Create Team",
      description: "Set up the provider team and assignments",
      completed: false,
      data: null
    },
    currentStep: 1,
    isComplete: false
  });

  // Fetch locations
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

  // Fetch providers
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
    }
  });

  // Step 1: Location Creation/Selection
  const [locationForm, setLocationForm] = useState({
    selectedLocationId: '',
    newLocationName: '',
    newLocationCity: '',
    newLocationState: '',
    newLocationAddress: ''
  });

  // Step 2: Provider Selection/Creation
  const [providerForm, setProviderForm] = useState({
    selectedProviderId: '',
    newProviderName: '',
    newProviderType: 'training_provider',
    newProviderEmail: '',
    newProviderPhone: ''
  });

  // Step 3: Team Creation
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    teamType: 'training_team',
    description: ''
  });

  // Mutations
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: any) => {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: locationData.name,
          city: locationData.city,
          state: locationData.state,
          address: locationData.address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });

  const createProviderMutation = useMutation({
    mutationFn: async (providerData: any) => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .insert({
          name: providerData.name,
          provider_name: providerData.name,
          provider_url: '',
          provider_type: providerData.provider_type,
          contact_email: providerData.contact_email,
          contact_phone: providerData.contact_phone,
          status: 'APPROVED',
          performance_rating: 0,
          compliance_score: 0,
          user_id: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          team_type: teamData.team_type,
          status: 'active',
          location_id: teamData.location_id,
          provider_id: teamData.provider_id,
          performance_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });

  const handleStep1Complete = async () => {
    try {
      let locationData;
      
      if (locationForm.selectedLocationId) {
        // Use existing location
        locationData = locations.find(l => l.id === locationForm.selectedLocationId);
      } else if (locationForm.newLocationName) {
        // Create new location
        locationData = await createLocationMutation.mutateAsync({
          name: locationForm.newLocationName,
          city: locationForm.newLocationCity,
          state: locationForm.newLocationState,
          address: locationForm.newLocationAddress
        });
        queryClient.invalidateQueries({ queryKey: ['locations'] });
      } else {
        toast.error('Please select or create a location');
        return;
      }

      setWorkflow(prev => ({
        ...prev,
        step1: { ...prev.step1, completed: true, data: locationData },
        currentStep: 2
      }));
      toast.success('Location selected successfully!');
    } catch (error) {
      toast.error('Failed to process location');
    }
  };

  const handleStep2Complete = async () => {
    try {
      let providerData;
      
      if (providerForm.selectedProviderId) {
        // Use existing provider
        providerData = providers.find(p => p.id === providerForm.selectedProviderId);
      } else if (providerForm.newProviderName) {
        // Create new provider
        providerData = await createProviderMutation.mutateAsync({
          name: providerForm.newProviderName,
          provider_type: providerForm.newProviderType,
          contact_email: providerForm.newProviderEmail,
          contact_phone: providerForm.newProviderPhone
        });
        queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
      } else {
        toast.error('Please select or create a provider');
        return;
      }

      setWorkflow(prev => ({
        ...prev,
        step2: { ...prev.step2, completed: true, data: providerData },
        currentStep: 3
      }));
      toast.success('Provider assigned successfully!');
    } catch (error) {
      toast.error('Failed to process provider');
    }
  };

  const handleStep3Complete = async () => {
    try {
      if (!teamForm.teamName) {
        toast.error('Please enter a team name');
        return;
      }

      const teamData = await createTeamMutation.mutateAsync({
        name: teamForm.teamName,
        team_type: teamForm.teamType,
        location_id: workflow.step1.data?.id,
        provider_id: workflow.step2.data?.id
      });

      setWorkflow(prev => ({
        ...prev,
        step3: { ...prev.step3, completed: true, data: teamData },
        isComplete: true
      }));

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully! Provider management setup complete.');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Select Existing Location</Label>
        <Select
          value={locationForm.selectedLocationId}
          onValueChange={(value) => setLocationForm(prev => ({ 
            ...prev, 
            selectedLocationId: value,
            newLocationName: '' // Clear new location form
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name} {location.city && `- ${location.city}, ${location.state}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        — OR —
      </div>

      <div className="space-y-3">
        <Label>Create New Location</Label>
        <Input
          placeholder="Location name"
          value={locationForm.newLocationName}
          onChange={(e) => setLocationForm(prev => ({ 
            ...prev, 
            newLocationName: e.target.value,
            selectedLocationId: '' // Clear selection
          }))}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="City"
            value={locationForm.newLocationCity}
            onChange={(e) => setLocationForm(prev => ({ ...prev, newLocationCity: e.target.value }))}
          />
          <Input
            placeholder="State"
            value={locationForm.newLocationState}
            onChange={(e) => setLocationForm(prev => ({ ...prev, newLocationState: e.target.value }))}
          />
        </div>
        <Textarea
          placeholder="Address"
          value={locationForm.newLocationAddress}
          onChange={(e) => setLocationForm(prev => ({ ...prev, newLocationAddress: e.target.value }))}
          rows={2}
        />
      </div>

      <Button 
        onClick={handleStep1Complete}
        disabled={!locationForm.selectedLocationId && !locationForm.newLocationName}
        className="w-full"
      >
        Continue to Provider Assignment
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Select Existing Provider</Label>
        <Select
          value={providerForm.selectedProviderId}
          onValueChange={(value) => setProviderForm(prev => ({ 
            ...prev, 
            selectedProviderId: value,
            newProviderName: '' // Clear new provider form
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name} ({provider.provider_type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        — OR —
      </div>

      <div className="space-y-3">
        <Label>Create New Provider</Label>
        <Input
          placeholder="Provider name"
          value={providerForm.newProviderName}
          onChange={(e) => setProviderForm(prev => ({ 
            ...prev, 
            newProviderName: e.target.value,
            selectedProviderId: '' // Clear selection
          }))}
        />
        <Select
          value={providerForm.newProviderType}
          onValueChange={(value) => setProviderForm(prev => ({ ...prev, newProviderType: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Provider type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="training_provider">Training Provider</SelectItem>
            <SelectItem value="certification_body">Certification Body</SelectItem>
            <SelectItem value="assessment_center">Assessment Center</SelectItem>
            <SelectItem value="training_partner">Training Partner</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Contact email"
            type="email"
            value={providerForm.newProviderEmail}
            onChange={(e) => setProviderForm(prev => ({ ...prev, newProviderEmail: e.target.value }))}
          />
          <Input
            placeholder="Contact phone"
            value={providerForm.newProviderPhone}
            onChange={(e) => setProviderForm(prev => ({ ...prev, newProviderPhone: e.target.value }))}
          />
        </div>
      </div>

      <Button 
        onClick={handleStep2Complete}
        disabled={!providerForm.selectedProviderId && !providerForm.newProviderName}
        className="w-full"
      >
        Continue to Team Creation
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Team Name</Label>
        <Input
          placeholder="Enter team name"
          value={teamForm.teamName}
          onChange={(e) => setTeamForm(prev => ({ ...prev, teamName: e.target.value }))}
        />
      </div>

      <div className="space-y-3">
        <Label>Team Type</Label>
        <Select
          value={teamForm.teamType}
          onValueChange={(value) => setTeamForm(prev => ({ ...prev, teamType: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select team type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="training_team">Training Team</SelectItem>
            <SelectItem value="assessment_team">Assessment Team</SelectItem>
            <SelectItem value="certification_team">Certification Team</SelectItem>
            <SelectItem value="support_team">Support Team</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Description (Optional)</Label>
        <Textarea
          placeholder="Team description"
          value={teamForm.description}
          onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Summary</h4>
        <div className="space-y-1 text-sm">
          <div>📍 Location: {workflow.step1.data?.name}</div>
          <div>🏢 Provider: {workflow.step2.data?.name}</div>
          <div>👥 Team: {teamForm.teamName || 'Not specified'}</div>
        </div>
      </div>

      <Button 
        onClick={handleStep3Complete}
        disabled={!teamForm.teamName}
        className="w-full"
      >
        Complete Setup
        <CheckCircle className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          3-Click Provider Management Setup
        </CardTitle>
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                workflow.currentStep === step
                  ? 'bg-primary text-primary-foreground'
                  : workflow.currentStep > step || (workflow as any)[`step${step}`].completed
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {(workflow as any)[`step${step}`].completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step
                )}
              </div>
              {step < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  workflow.currentStep > step ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {workflow.isComplete ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Setup Complete!</h3>
            <p className="text-muted-foreground">
              Your provider management setup has been completed successfully.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="font-medium mb-1">
                Step {workflow.currentStep}: {(workflow as any)[`step${workflow.currentStep}`].title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {(workflow as any)[`step${workflow.currentStep}`].description}
              </p>
            </div>
            
            {workflow.currentStep === 1 && renderStep1()}
            {workflow.currentStep === 2 && renderStep2()}
            {workflow.currentStep === 3 && renderStep3()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}