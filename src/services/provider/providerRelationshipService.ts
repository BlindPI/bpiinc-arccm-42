
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID, validateUUID } from '@/utils/uuidValidation';

export interface ProviderRelationship {
  providerId: string;
  apUserId: string;
  locationId: string;
  teamId?: string;
  status: 'active' | 'inactive' | 'pending';
  assignedAt: Date;
  assignedBy: string;
}

export interface RelationshipValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: RelationshipConflict[];
}

export interface RelationshipConflict {
  type: 'ap_multiple_locations' | 'location_multiple_providers' | 'team_orphaned';
  message: string;
  affectedEntities: string[];
  resolutionOptions: string[];
}

export class ProviderRelationshipService {
  /**
   * Validates a complete AP User to Provider to Location to Team relationship
   */
  async validateRelationship(relationship: Partial<ProviderRelationship>): Promise<RelationshipValidationResult> {
    const result: RelationshipValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      conflicts: []
    };

    // Validate UUID formats
    if (relationship.providerId && !isValidUUID(relationship.providerId)) {
      result.errors.push('Invalid provider ID format');
    }
    if (relationship.apUserId && !isValidUUID(relationship.apUserId)) {
      result.errors.push('Invalid AP user ID format');
    }
    if (relationship.locationId && !isValidUUID(relationship.locationId)) {
      result.errors.push('Invalid location ID format');
    }

    // Check for existing conflicts
    if (relationship.apUserId && relationship.locationId) {
      const conflicts = await this.checkRelationshipConflicts(relationship.apUserId, relationship.locationId);
      result.conflicts.push(...conflicts);
    }

    // Validate entities exist
    if (relationship.providerId) {
      const providerExists = await this.validateProviderExists(relationship.providerId);
      if (!providerExists) {
        result.errors.push('Provider does not exist');
      }
    }

    if (relationship.apUserId) {
      const apUserExists = await this.validateAPUserExists(relationship.apUserId);
      if (!apUserExists) {
        result.errors.push('AP User does not exist');
      }
    }

    if (relationship.locationId) {
      const locationExists = await this.validateLocationExists(relationship.locationId);
      if (!locationExists) {
        result.errors.push('Location does not exist');
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Creates a complete AP User to Provider relationship with location and team assignment
   */
  async createCompleteRelationship(
    apUserId: string,
    locationId: string,
    assignedBy: string,
    options: {
      createProvider?: boolean;
      providerName?: string;
      createTeam?: boolean;
      teamName?: string;
    } = {}
  ): Promise<ProviderRelationship> {
    // Validate the relationship first
    const validation = await this.validateRelationship({ apUserId, locationId });
    if (!validation.isValid) {
      throw new Error(`Relationship validation failed: ${validation.errors.join(', ')}`);
    }

    let providerId: string;

    // Step 1: Create or get provider
    if (options.createProvider && options.providerName) {
      providerId = await this.createProviderFromAPUser(apUserId, options.providerName);
    } else {
      // Check if AP user already has a provider
      const existingProvider = await this.getProviderByAPUser(apUserId);
      if (!existingProvider) {
        throw new Error('AP User does not have an associated provider. Use createProvider option.');
      }
      providerId = existingProvider.id;
    }

    // Step 2: Assign provider to location
    await this.assignProviderToLocation(providerId, locationId);

    // Step 3: Create team if requested
    let teamId: string | undefined;
    if (options.createTeam) {
      teamId = await this.createLocationTeam(
        providerId,
        locationId,
        options.teamName || `${options.providerName || 'Provider'} Team`,
        assignedBy
      );
    }

    // Step 4: Create AP user location assignment
    await this.createAPUserLocationAssignment(apUserId, locationId, assignedBy);

    // Step 5: Add AP user to team if team was created
    if (teamId) {
      await this.addAPUserToTeam(apUserId, teamId);
    }

    return {
      providerId,
      apUserId,
      locationId,
      teamId,
      status: 'active',
      assignedAt: new Date(),
      assignedBy
    };
  }

  /**
   * Gets complete relationship data for an AP user
   */
  async getAPUserRelationships(apUserId: string): Promise<ProviderRelationship[]> {
    validateUUID(apUserId, 'AP User ID');

    const { data, error } = await supabase
      .from('ap_user_location_assignments')
      .select(`
        *,
        location:locations(*),
        assigned_by_profile:profiles!assigned_by(display_name)
      `)
      .eq('ap_user_id', apUserId)
      .eq('status', 'active');

    if (error) throw error;

    const relationships: ProviderRelationship[] = [];
    
    for (const assignment of data || []) {
      const provider = await this.getProviderByLocation(assignment.location_id);
      const teams = await this.getLocationTeams(assignment.location_id);
      
      relationships.push({
        providerId: provider?.id || '',
        apUserId: assignment.ap_user_id,
        locationId: assignment.location_id,
        teamId: teams.length > 0 ? teams[0].id : undefined,
        status: assignment.status as 'active' | 'inactive' | 'pending',
        assignedAt: new Date(assignment.assigned_at),
        assignedBy: assignment.assigned_by
      });
    }

    return relationships;
  }

  /**
   * Removes a complete relationship (AP user, provider, location, team)
   */
  async removeRelationship(apUserId: string, locationId: string): Promise<void> {
    validateUUID(apUserId, 'AP User ID');
    validateUUID(locationId, 'Location ID');

    // Remove AP user from teams at this location
    const teams = await this.getLocationTeams(locationId);
    for (const team of teams) {
      await this.removeAPUserFromTeam(apUserId, team.id);
    }

    // Remove AP user location assignment
    const { error } = await supabase
      .from('ap_user_location_assignments')
      .delete()
      .eq('ap_user_id', apUserId)
      .eq('location_id', locationId);

    if (error) throw error;

    // Note: We don't automatically remove the provider or teams as they might have other users
  }

  // Private helper methods
  private async checkRelationshipConflicts(apUserId: string, locationId: string): Promise<RelationshipConflict[]> {
    const conflicts: RelationshipConflict[] = [];

    // Check if AP user is already assigned to another location
    const { data: existingAssignments } = await supabase
      .from('ap_user_location_assignments')
      .select('location_id, locations(name)')
      .eq('ap_user_id', apUserId)
      .eq('status', 'active')
      .neq('location_id', locationId);

    if (existingAssignments && existingAssignments.length > 0) {
      conflicts.push({
        type: 'ap_multiple_locations',
        message: 'AP User is already assigned to another location',
        affectedEntities: existingAssignments.map(a => a.location_id),
        resolutionOptions: ['Remove existing assignment', 'Allow multiple locations', 'Cancel new assignment']
      });
    }

    // Check if location already has a different provider
    const existingProvider = await this.getProviderByLocation(locationId);
    if (existingProvider) {
      const apUser = await this.getAPUserByProvider(existingProvider.id);
      if (apUser && apUser.id !== apUserId) {
        conflicts.push({
          type: 'location_multiple_providers',
          message: 'Location already has a different authorized provider',
          affectedEntities: [existingProvider.id, apUser.id],
          resolutionOptions: ['Replace existing provider', 'Allow multiple providers', 'Cancel assignment']
        });
      }
    }

    return conflicts;
  }

  private async validateProviderExists(providerId: string): Promise<boolean> {
    const { data } = await supabase
      .from('authorized_providers')
      .select('id')
      .eq('id', providerId)
      .single();
    return !!data;
  }

  private async validateAPUserExists(apUserId: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', apUserId)
      .eq('role', 'AP')
      .single();
    return !!data;
  }

  private async validateLocationExists(locationId: string): Promise<boolean> {
    const { data } = await supabase
      .from('locations')
      .select('id')
      .eq('id', locationId)
      .single();
    return !!data;
  }

  private async createProviderFromAPUser(apUserId: string, providerName: string): Promise<string> {
    const { data: apUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', apUserId)
      .single();

    if (!apUser) throw new Error('AP User not found');

    const { data: provider, error } = await supabase
      .from('authorized_providers')
      .insert({
        name: providerName,
        provider_name: providerName,
        provider_url: '',
        provider_type: 'training_provider',
        status: 'approved',
        contact_email: apUser.email,
        user_id: apUserId,
        performance_rating: 0,
        compliance_score: 0
      })
      .select()
      .single();

    if (error) throw error;
    return provider.id;
  }

  private async assignProviderToLocation(providerId: string, locationId: string): Promise<void> {
    const { error } = await supabase
      .from('authorized_providers')
      .update({ primary_location_id: locationId })
      .eq('id', providerId);

    if (error) throw error;
  }

  private async createLocationTeam(
    providerId: string,
    locationId: string,
    teamName: string,
    createdBy: string
  ): Promise<string> {
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        description: `Provider team for location`,
        team_type: 'provider_team',
        location_id: locationId,
        provider_id: providerId,
        status: 'active',
        performance_score: 0,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw error;
    return team.id;
  }

  private async createAPUserLocationAssignment(
    apUserId: string,
    locationId: string,
    assignedBy: string
  ): Promise<void> {
    const { error } = await supabase
      .from('ap_user_location_assignments')
      .insert({
        ap_user_id: apUserId,
        location_id: locationId,
        assignment_role: 'provider',
        status: 'active',
        assigned_by: assignedBy,
        start_date: new Date().toISOString().split('T')[0]
      });

    if (error) throw error;
  }

  private async addAPUserToTeam(apUserId: string, teamId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: apUserId,
        role: 'ADMIN',
        status: 'active',
        team_position: 'Provider Manager',
        permissions: { admin: true, manage_location: true }
      });

    if (error) throw error;
  }

  private async removeAPUserFromTeam(apUserId: string, teamId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', apUserId);

    if (error) throw error;
  }

  private async getProviderByAPUser(apUserId: string) {
    const { data } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('user_id', apUserId)
      .single();
    return data;
  }

  private async getProviderByLocation(locationId: string) {
    const { data } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('primary_location_id', locationId)
      .single();
    return data;
  }

  private async getAPUserByProvider(providerId: string) {
    const { data: provider } = await supabase
      .from('authorized_providers')
      .select('user_id')
      .eq('id', providerId)
      .single();

    if (!provider?.user_id) return null;

    const { data: apUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', provider.user_id)
      .single();

    return apUser;
  }

  private async getLocationTeams(locationId: string) {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('location_id', locationId)
      .eq('status', 'active');
    return data || [];
  }
}

export const providerRelationshipService = new ProviderRelationshipService();
