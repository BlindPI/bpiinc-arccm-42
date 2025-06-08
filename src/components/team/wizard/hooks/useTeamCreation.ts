
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  provider_id: string;
  permissions: {
    can_manage_members: boolean;
    can_manage_courses: boolean;
    can_view_analytics: boolean;
    can_manage_settings: boolean;
    can_approve_certificates: boolean;
    can_manage_locations: boolean;
  };
}

const initialFormData: TeamFormData = {
  name: '',
  description: '',
  team_type: '',
  location_id: '',
  provider_id: '',
  permissions: {
    can_manage_members: true,
    can_manage_courses: false,
    can_view_analytics: true,
    can_manage_settings: false,
    can_approve_certificates: false,
    can_manage_locations: false
  }
};

export function useTeamCreation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TeamFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (updates: Partial<TeamFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear related errors when user updates fields
    const updatedFields = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) {
          newErrors.name = 'Team name is required';
        }
        if (!formData.team_type) {
          newErrors.team_type = 'Team type is required';
        }
        break;
      case 1: // Location & Provider
        if (!formData.location_id) {
          newErrors.location_id = 'Location is required';
        }
        break;
      // Steps 2 (Permissions) and 3 (Review) don't require validation
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User must be authenticated');

      const teamData = {
        name: formData.name,
        description: formData.description,
        team_type: formData.team_type,
        location_id: formData.location_id || undefined,
        provider_id: formData.provider_id || undefined,
        metadata: {
          permissions: formData.permissions,
          created_via: 'wizard'
        },
        created_by: user.id
      };

      return teamManagementService.createTeam(teamData);
    },
    onSuccess: (team) => {
      toast.success('Team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams-hub'] });
      queryClient.invalidateQueries({ queryKey: ['system-analytics'] });
      
      // Reset form
      setFormData(initialFormData);
      setErrors({});
      
      return team;
    },
    onError: (error: any) => {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
  };

  return {
    formData,
    updateFormData,
    errors,
    validateStep,
    createTeam: createTeamMutation.mutate,
    isCreating: createTeamMutation.isPending,
    resetForm
  };
}
