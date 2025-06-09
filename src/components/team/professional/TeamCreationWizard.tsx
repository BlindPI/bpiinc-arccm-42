import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Users, Settings, MapPin } from 'lucide-react';
import type { EnhancedTeam } from '@/types/team-management';

interface TeamCreationWizardProps {
  onClose: () => void;
  onTeamCreated: (team: EnhancedTeam) => void;
}

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  provider_id: string;
}

// Helper function to safely convert Json to Record<string, any>
const safeJsonToRecord = (value: any): Record<string, any> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return {};
};

export function TeamCreationWizard({ onClose, onTeamCreated }: TeamCreationWizardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    team_type: 'operational',
    location_id: '',
    provider_id: ''
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
      return data || [];
    }
  });

  // Fetch providers with proper column hint
  const { data: providers = [] } = useQuery({
    queryKey: ['authorized_providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: TeamFormData) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          team_type: teamData.team_type,
          location_id: teamData.location_id || null,
          provider_id: teamData.provider_id ? parseInt(teamData.provider_id) : null,
          status: 'active',
          performance_score: 0,
          created_by: user?.id,
          metadata: {},
          monthly_targets: {},
          current_metrics: {}
        })
        .select(`
          *,
          locations(*),
          authorized_providers!provider_id(*)
        `)
        .single();

      if (error) throw error;

      // Transform to EnhancedTeam format with proper type safety
      const enhancedTeam: EnhancedTeam = {
        ...data,
        provider_id: data.provider_id?.toString() || '',
        status: data.status as 'active' | 'inactive' | 'suspended',
        metadata: safeJsonToRecord(data.metadata),
        monthly_targets: safeJsonToRecord(data.monthly_targets),
        current_metrics: safeJsonToRecord(data.current_metrics),
        location: data.locations || undefined,
        provider: data.authorized_providers ? {
          id: data.authorized_providers.id.toString(),
          name: data.authorized_providers.name,
          provider_type: data.authorized_providers.provider_type || 'training_provider',
          status: data.authorized_providers.status || 'active',
          performance_rating: data.authorized_providers.performance_rating || 0,
          compliance_score: data.authorized_providers.compliance_score || 0,
          created_at: data.authorized_providers.created_at,
          updated_at: data.authorized_providers.updated_at,
          description: data.authorized_providers.description
        } : undefined,
        members: [],
        member_count: 0
      };

      return enhancedTeam;
    },
    onSuccess: (team) => {
      toast.success('Team created successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      onTeamCreated(team);
    },
    onError: (error: any) => {
      toast.error('Failed to create team: ' + error.message);
    }
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    
    createTeamMutation.mutate(formData);
  };

  const steps = [
    {
      title: 'Basic Information',
      description: 'Team name and description'
    },
    {
      title: 'Configuration',
      description: 'Team type and location'
    },
    {
      title: 'Review',
      description: 'Confirm team details'
    }
  ];

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
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the team's purpose and responsibilities"
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Team Type</Label>
              <Select 
                value={formData.team_type} 
                onValueChange={(value) => setFormData({ ...formData, team_type: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location (Optional)</Label>
              <Select 
                value={formData.location_id} 
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific location</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {location.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Provider (Optional)</Label>
              <Select 
                value={formData.provider_id} 
                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No provider</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {provider.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        const selectedLocation = locations.find(l => l.id === formData.location_id);
        const selectedProvider = providers.find(p => p.id.toString() === formData.provider_id);
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review Team Details</h3>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{formData.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge variant="secondary" className="ml-2">
                    {formData.team_type}
                  </Badge>
                </div>
                
                {selectedLocation && (
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm text-muted-foreground">{selectedLocation.name}</p>
                  </div>
                )}
                
                {selectedProvider && (
                  <div>
                    <Label className="text-sm font-medium">Provider</Label>
                    <p className="text-sm text-muted-foreground">{selectedProvider.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 <= currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-px bg-border ml-6" />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
            >
              {currentStep > 1 ? 'Previous' : 'Cancel'}
            </Button>
            
            {currentStep < steps.length ? (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && !formData.name.trim()}
              >
                Next
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
