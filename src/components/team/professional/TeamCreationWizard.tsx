
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Users, MapPin, Building2, Target } from 'lucide-react';
import type { EnhancedTeam, CreateTeamRequest } from '@/types/team-management';

interface TeamCreationWizardProps {
  onClose: () => void;
  onTeamCreated: (team: EnhancedTeam) => void;
}

const TEAM_TYPES = [
  { value: 'operational', label: 'Operational Team', description: 'Day-to-day operations and service delivery' },
  { value: 'training', label: 'Training Team', description: 'Education and skill development focused' },
  { value: 'management', label: 'Management Team', description: 'Leadership and strategic oversight' },
  { value: 'specialized', label: 'Specialized Team', description: 'Expert teams for specific functions' },
  { value: 'cross_functional', label: 'Cross-Functional', description: 'Multi-disciplinary collaboration' }
];

export function TeamCreationWizard({ onClose, onTeamCreated }: TeamCreationWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [teamData, setTeamData] = useState<Partial<CreateTeamRequest>>({
    created_by: user?.id
  });

  // Fetch locations for team assignment
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

  // Fetch providers for team assignment
  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (request: CreateTeamRequest) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: request.name,
          description: request.description,
          team_type: request.team_type,
          location_id: request.location_id,
          provider_id: request.provider_id,
          created_by: request.created_by,
          status: 'active',
          performance_score: 0,
          metadata: request.metadata || {},
          monthly_targets: {},
          current_metrics: {}
        })
        .select(`
          *,
          locations(*),
          providers(*)
        `)
        .single();

      if (error) throw error;

      // Add creator as team admin
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: data.id,
          user_id: request.created_by,
          role: 'ADMIN',
          status: 'active',
          permissions: {},
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        console.error('Error adding team creator as admin:', memberError);
      }

      return {
        ...data,
        metadata: data.metadata || {},
        monthly_targets: data.monthly_targets || {},
        current_metrics: data.current_metrics || {},
        location: data.locations,
        provider: data.providers,
        members: [],
        member_count: 1
      } as EnhancedTeam;
    },
    onSuccess: (team) => {
      toast.success('Team created successfully');
      onTeamCreated(team);
    },
    onError: (error: any) => {
      toast.error('Failed to create team: ' + error.message);
    }
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!teamData.name || !teamData.team_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    createTeamMutation.mutate(teamData as CreateTeamRequest);
  };

  const isStepValid = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return !!(teamData.name && teamData.team_type);
      case 2:
        return true; // Optional fields
      case 3:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNum 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${step > stepNum ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    value={teamData.name || ''}
                    onChange={(e) => setTeamData({...teamData, name: e.target.value})}
                    placeholder="Enter team name"
                  />
                </div>

                <div>
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea
                    id="team-description"
                    value={teamData.description || ''}
                    onChange={(e) => setTeamData({...teamData, description: e.target.value})}
                    placeholder="Describe the team's purpose and goals"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Team Type *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {TEAM_TYPES.map((type) => (
                      <Card 
                        key={type.value}
                        className={`cursor-pointer transition-all hover:shadow-sm ${
                          teamData.team_type === type.value ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setTeamData({...teamData, team_type: type.value})}
                      >
                        <CardContent className="p-3">
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {type.description}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Location & Provider Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Primary Location</Label>
                  <Select 
                    value={teamData.location_id || ''} 
                    onValueChange={(value) => setTeamData({...teamData, location_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label>Provider Association</Label>
                  <Select 
                    value={teamData.provider_id || ''} 
                    onValueChange={(value) => setTeamData({...teamData, provider_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider (optional)" />
                    </SelectTrigger>
                    <SelectContent>
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
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Review & Create
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Team Name</Label>
                    <p className="text-sm text-muted-foreground">{teamData.name}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Team Type</Label>
                    <Badge variant="secondary">
                      {TEAM_TYPES.find(t => t.value === teamData.team_type)?.label}
                    </Badge>
                  </div>

                  {teamData.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground">{teamData.description}</p>
                    </div>
                  )}

                  {teamData.location_id && (
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p className="text-sm text-muted-foreground">
                        {locations.find(l => l.id === teamData.location_id)?.name}
                      </p>
                    </div>
                  )}

                  {teamData.provider_id && (
                    <div>
                      <Label className="text-sm font-medium">Provider</Label>
                      <p className="text-sm text-muted-foreground">
                        {providers.find(p => p.id.toString() === teamData.provider_id)?.name}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={step === 1 ? onClose : handlePrevious}
            >
              {step === 1 ? 'Cancel' : 'Previous'}
            </Button>

            <Button 
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={!isStepValid(step) || createTeamMutation.isPending}
            >
              {step === 3 
                ? createTeamMutation.isPending ? 'Creating...' : 'Create Team'
                : 'Next'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
