
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { useAuth } from '@/contexts/AuthContext';
import type { CreateTeamRequest, Team } from '@/types/team-management';

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  provider_id: string;
  permissions: Record<string, boolean>;
}

interface ValidationErrors {
  [key: string]: string;
}

export function useTeamCreation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    team_type: '',
    location_id: '',
    provider_id: '',
    permissions: {}
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const updateFormData = useCallback((updates: Partial<TeamFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Clear related errors when data is updated
    const updatedFields = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => {
        delete newErrors[field];
      });
      return newErrors;
    });
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) {
          newErrors.name = 'Team name is required';
        } else if (formData.name.length < 3) {
          newErrors.name = 'Team name must be at least 3 characters';
        }
        
        if (!formData.team_type) {
          newErrors.team_type = 'Team type is required';
        }
        break;

      case 1: // Location & Provider
        if (!formData.location_id) {
          newErrors.location_id = 'Location is required';
        }
        
        if (formData.team_type === 'provider_team' && !formData.provider_id) {
          newErrors.provider_id = 'Provider is required for provider teams';
        }
        break;

      case 2: // Permissions
        // Permissions are optional, no validation needed
        break;

      case 3: // Review
        // All previous validations should pass
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const isFormValid = useCallback((): boolean => {
    return validateStep(0) && validateStep(1) && validateStep(2);
  }, [validateStep]);

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: CreateTeamRequest) => {
      return teamManagementService.createTeam(teamData);
    },
    onSuccess: (team: Team) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-analytics'] });
    }
  });

  const createTeam = useCallback(async (
    onSuccess?: (team: Team) => void,
    onError?: (error: any) => void
  ) => {
    if (!user?.id) {
      onError?.(new Error('User must be authenticated'));
      return;
    }

    if (!isFormValid()) {
      onError?.(new Error('Form validation failed'));
      return;
    }

    try {
      const teamData: CreateTeamRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        team_type: formData.team_type,
        location_id: formData.location_id || undefined,
        provider_id: formData.provider_id || undefined,
        metadata: {
          permissions: formData.permissions,
          created_via: 'wizard',
          wizard_version: '2.0'
        },
        created_by: user.id
      };

      const result = await createTeamMutation.mutateAsync(teamData);
      onSuccess?.(result);
      return result;
    } catch (error) {
      onError?.(error);
      throw error;
    }
  }, [formData, user?.id, isFormValid, createTeamMutation]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      team_type: '',
      location_id: '',
      provider_id: '',
      permissions: {}
    });
    setErrors({});
  }, []);

  return {
    formData,
    updateFormData,
    errors,
    validateStep,
    isFormValid,
    createTeam,
    isCreating: createTeamMutation.isPending,
    resetForm
  };
}
