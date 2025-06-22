/**
 * TEAM CREATION WIZARD - PROVIDER INTERFACE
 * 
 * ✅ Full team creation workflow with real database integration
 * ✅ Multi-step form with validation
 * ✅ Location assignment
 * ✅ Member selection and role assignment
 * ✅ Provider context integration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Users,
  MapPin,
  Settings,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  UserPlus,
  Target,
  AlertTriangle
} from 'lucide-react';

interface TeamCreationWizardProps {
  onComplete: (teamId: string) => void;
  onCancel: () => void;
}

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  max_members: number;
  selectedMembers: string[];
  goals: string;
  performance_targets: {
    monthly_certificates: number;
    monthly_courses: number;
    quality_score: number;
  };
}

interface Location {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface AvailableMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
}

const TEAM_TYPES = [
  { value: 'training', label: 'Training Team' },
  { value: 'certification', label: 'Certification Team' },
  { value: 'mixed', label: 'Mixed Operations' },
  { value: 'specialized', label: 'Specialized Team' }
];

export function TeamCreationWizard({ onComplete, onCancel }: TeamCreationWizardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    team_type: '',
    location_id: '',
    max_members: 10,
    selectedMembers: [],
    goals: '',
    performance_targets: {
      monthly_certificates: 20,
      monthly_courses: 5,
      quality_score: 85
    }
  });

  // Get provider context
  const { data: providerData } = useQuery({
    queryKey: ['current-provider', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Load available locations
  const { data: locations = [] } = useQuery({
    queryKey: ['provider-locations', providerData?.id],
    queryFn: async (): Promise<Location[]> => {
      if (!providerData?.id) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('provider_id', providerData.id)
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!providerData?.id
  });

  // Load available team members
  const { data: availableMembers = [] } = useQuery({
    queryKey: ['available-members', providerData?.id],
    queryFn: async (): Promise<AvailableMember[]> => {
      if (!providerData?.id) return [];
      
      // Get users with instructor roles who could be team members
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, status')
        .in('role', ['IC', 'IP', 'IT', 'IN']) // Instructor roles
        .eq('status', 'active')
        .order('first_name');
      
      if (error) throw error;
      
      // Transform data to match AvailableMember interface
      return (data || []).map(profile => ({
        id: profile.id,
        full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: profile.email || '',
        role: profile.role || '',
        status: profile.status || 'active'
      }));
    },
    enabled: !!providerData?.id
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: TeamFormData) => {
      if (!providerData?.id) throw new Error('Provider context required');
      
      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          team_type: teamData.team_type,
          location_id: teamData.location_id,
          provider_id: providerData.id,
          max_members: teamData.max_members,
          status: 'active',
          goals: teamData.goals,
          performance_targets: teamData.performance_targets
        })
        .select()
        .single();
      
      if (teamError) throw teamError;

      // Add selected members to the team
      if (teamData.selectedMembers.length > 0) {
        const memberInserts = teamData.selectedMembers.map(memberId => ({
          team_id: team.id,
          user_id: memberId,
          role: 'member',
          status: 'active',
          joined_at: new Date().toISOString()
        }));

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(memberInserts);
        
        if (membersError) throw membersError;
      }

      return team;
    },
    onSuccess: (team) => {
      toast.success('Team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['unified-teams'] });
      onComplete(team.id);
    },
    onError: (error: any) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          toast.error('Team name is required');
          return false;
        }
        if (!formData.team_type) {
          toast.error('Team type is required');
          return false;
        }
        return true;
      case 2:
        if (!formData.location_id) {
          toast.error('Location selection is required');
          return false;
        }
        return true;
      case 3:
        return true; // Member selection is optional
      case 4:
        return true; // Goals and targets are optional
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      await createTeamMutation.mutateAsync(formData);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter team name..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the team's purpose and responsibilities..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="team_type">Team Type *</Label>
                <Select 
                  value={formData.team_type} 
                  onValueChange={(value) => setFormData({ ...formData, team_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max_members">Maximum Members</Label>
                <Input
                  id="max_members"
                  type="number"
                  min="3"
                  max="50"
                  value={formData.max_members}
                  onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="location">Team Location *</Label>
              <Select 
                value={formData.location_id} 
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <div>{location.name}</div>
                          <div className="text-xs text-muted-foreground">{location.address}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {locations.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No locations found. You may need to set up locations first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>Select Team Members (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Choose instructors to add to this team. You can add more members later.
              </p>
            </div>

            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {availableMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={formData.selectedMembers.includes(member.id)}
                    onCheckedChange={() => toggleMemberSelection(member.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{member.full_name}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {formData.selectedMembers.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Selected: {formData.selectedMembers.length} members
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="goals">Team Goals</Label>
              <Textarea
                id="goals"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="Define team objectives and goals..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>Performance Targets</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="monthly_certs">Monthly Certificates</Label>
                  <Input
                    id="monthly_certs"
                    type="number"
                    min="0"
                    value={formData.performance_targets.monthly_certificates}
                    onChange={(e) => setFormData({
                      ...formData,
                      performance_targets: {
                        ...formData.performance_targets,
                        monthly_certificates: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="monthly_courses">Monthly Courses</Label>
                  <Input
                    id="monthly_courses"
                    type="number"
                    min="0"
                    value={formData.performance_targets.monthly_courses}
                    onChange={(e) => setFormData({
                      ...formData,
                      performance_targets: {
                        ...formData.performance_targets,
                        monthly_courses: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="quality_score">Quality Score (%)</Label>
                  <Input
                    id="quality_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.performance_targets.quality_score}
                    onChange={(e) => setFormData({
                      ...formData,
                      performance_targets: {
                        ...formData.performance_targets,
                        quality_score: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    'Basic Information',
    'Location Assignment',
    'Team Members',
    'Goals & Targets'
  ];

  const stepIcons = [Settings, MapPin, Users, Target];

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {stepTitles.map((title, index) => {
          const StepIcon = stepIcons[index];
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          
          return (
            <div
              key={stepNumber}
              className={`flex items-center gap-2 ${
                isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isActive ? 'border-primary bg-primary text-primary-foreground' :
                isCompleted ? 'border-green-600 bg-green-600 text-white' :
                'border-muted-foreground'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span className="text-sm font-medium hidden md:block">{title}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(stepIcons[currentStep - 1], { className: "h-5 w-5" })}
            {stepTitles[currentStep - 1]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          )}
          
          {currentStep < 4 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? (
                <>Creating...</>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Create Team
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
