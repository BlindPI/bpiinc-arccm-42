
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

interface ValidationError {
  field: string;
  message: string;
}

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

  const validateTeamName = (name: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!name.trim()) {
      errors.push({ field: 'name', message: 'Team name is required' });
    } else if (name.trim().length < 3) {
      errors.push({ field: 'name', message: 'Team name must be at least 3 characters long' });
    } else if (name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Team name must be less than 100 characters' });
    } else if (!/^[a-zA-Z0-9\s\-_&()]+$/.test(name.trim())) {
      errors.push({ field: 'name', message: 'Team name contains invalid characters' });
    }
    
    return errors;
  };

  const validateTeamType = (teamType: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const validTypes = ['operational', 'administrative', 'training', 'provider_team', 'compliance', 'support'];
    
    if (!teamType) {
      errors.push({ field: 'team_type', message: 'Team type is required' });
    } else if (!validTypes.includes(teamType)) {
      errors.push({ field: 'team_type', message: 'Invalid team type selected' });
    }
    
    return errors;
  };

  const validateLocation = (locationId: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!locationId) {
      errors.push({ field: 'location_id', message: 'Location is required' });
    }
    
    return errors;
  };

  const validateProvider = (providerId: string, teamType: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Provider is only required for provider teams
    if (teamType === 'provider_team' && !providerId) {
      errors.push({ field: 'provider_id', message: 'Provider is required for provider teams' });
    }
    
    return errors;
  };

  const validateStep = (step: number): boolean => {
    const validationErrors: ValidationError[] = [];

    switch (step) {
      case 0: // Basic Info
        validationErrors.push(...validateTeamName(formData.name));
        validationErrors.push(...validateTeamType(formData.team_type));
        break;
        
      case 1: // Location & Provider
        validationErrors.push(...validateLocation(formData.location_id));
        validationErrors.push(...validateProvider(formData.provider_id, formData.team_type));
        break;
        
      case 2: // Permissions - no validation needed
        break;
        
      case 3: // Review - final validation
        validationErrors.push(...validateTeamName(formData.name));
        validationErrors.push(...validateTeamType(formData.team_type));
        validationErrors.push(...validateLocation(formData.location_id));
        validationErrors.push(...validateProvider(formData.provider_id, formData.team_type));
        break;
    }

    // Convert validation errors to error object
    const newErrors: Record<string, string> = {};
    validationErrors.forEach(error => {
      newErrors[error.field] = error.message;
    });

    setErrors(newErrors);
    return validationErrors.length === 0;
  };

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User must be authenticated to create a team');
      }

      // Final validation before submission
      if (!validateStep(3)) {
        throw new Error('Please fix validation errors before creating the team');
      }

      const teamData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        team_type: formData.team_type,
        location_id: formData.location_id,
        provider_id: formData.provider_id || undefined,
        metadata: {
          permissions: formData.permissions,
          created_via: 'universal_wizard',
          creation_timestamp: new Date().toISOString()
        },
        created_by: user.id
      };

      console.log('Creating team with data:', teamData);
      
      const result = await teamManagementService.createTeam(teamData);
      
      if (!result?.id) {
        throw new Error('Team creation failed - no team ID returned');
      }

      return result;
    },
    onSuccess: (team) => {
      toast.success(`Team "${team.name}" created successfully!`);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams-hub'] });
      queryClient.invalidateQueries({ queryKey: ['system-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['team-memberships'] });
      
      // Reset form
      setFormData(initialFormData);
      setErrors({});
      
      return team;
    },
    onError: (error: any) => {
      console.error('Error creating team:', error);
      const message = error?.message || 'Failed to create team. Please try again.';
      toast.error(message);
      throw error;
    }
  });

  const createTeam = async (onSuccess?: (team: any) => void, onError?: (error: any) => void) => {
    try {
      const result = await createTeamMutation.mutateAsync();
      onSuccess?.(result);
      return result;
    } catch (error) {
      onError?.(error);
      throw error;
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
  };

  const isFormValid = (): boolean => {
    return validateStep(3);
  };

  return {
    formData,
    updateFormData,
    errors,
    validateStep,
    createTeam,
    isCreating: createTeamMutation.isPending,
    resetForm,
    isFormValid
  };
}
