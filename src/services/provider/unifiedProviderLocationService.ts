/**
 * Unified Provider Location Service
 * Ensures consistency between AP user assignments, authorized providers, and team relationships
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProviderLocationAssignment {
  apUserId: string;
  locationId: string;
  status: 'active' | 'inactive';
  assignmentRole: 'provider' | 'supervisor' | 'coordinator';
}

export interface TeamProviderRelationship {
  teamId: string;
  teamName: string;
  locationId: string;
  locationName: string;
  providerId: string;
  providerName: string;
  assignmentStatus: 'complete' | 'partial' | 'missing';
  issues: string[];
}

export class UnifiedProviderLocationService {
  
  /**
   * Get comprehensive assignment status for all AP users
   */
  static async getAPUserAssignmentStatus() {
    try {
      const { data: apUsers, error: apError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .eq('role', 'AP');
      
      if (apError) throw apError;

      const results = [];

      for (const user of apUsers || []) {
        // Check ap_user_location_assignments
        const { data: locationAssignments } = await supabase
          .from('ap_user_location_assignments')
          .select(`
            id, location_id, status, assignment_role,
            locations(id, name, city, state)
          `)
          .eq('ap_user_id', user.id)
          .eq('status', 'active');

        // Check authorized_providers
        const { data: providerRecord } = await supabase
          .from('authorized_providers')
          .select(`
            id, primary_location_id, status,
            primary_location:locations!primary_location_id(id, name, city, state)
          `)
          .eq('user_id', user.id)
          .single();

        // Check teams managed by this provider
        const { data: managedTeams } = await supabase
          .from('teams')
          .select(`
            id, name, status, location_id, provider_id,
            locations(id, name),
            team_members(id)
          `)
          .eq('provider_id', providerRecord?.id);

        // Analyze assignment status
        const hasLocationAssignment = (locationAssignments?.length || 0) > 0;
        const hasProviderRecord = !!providerRecord;
        const hasManagedTeams = (managedTeams?.length || 0) > 0;

        let assignmentStatus: 'complete' | 'partial' | 'missing' | 'conflict';
        const issues: string[] = [];

        if (hasLocationAssignment && hasProviderRecord) {
          // Check if assignments are consistent
          const assignedLocationIds = locationAssignments?.map(a => a.location_id) || [];
          const providerLocationId = providerRecord.primary_location_id;
          
          if (assignedLocationIds.includes(providerLocationId)) {
            assignmentStatus = 'complete';
          } else {
            assignmentStatus = 'conflict';
            issues.push('Location assignments and provider record are inconsistent');
          }
        } else if (hasLocationAssignment && !hasProviderRecord) {
          assignmentStatus = 'partial';
          issues.push('Has location assignment but missing authorized provider record');
        } else if (!hasLocationAssignment && hasProviderRecord) {
          assignmentStatus = 'partial';
          issues.push('Has provider record but missing location assignment');
        } else {
          assignmentStatus = 'missing';
          issues.push('No location assignments or provider record found');
        }

        results.push({
          userId: user.id,
          displayName: user.display_name,
          email: user.email,
          assignmentStatus,
          issues,
          locationAssignments: locationAssignments || [],
          providerRecord,
          managedTeams: managedTeams || []
        });
      }

      return results;
    } catch (error) {
      console.error('Error getting AP user assignment status:', error);
      throw error;
    }
  }

  /**
   * Ensure AP user has proper location assignment and provider record
   */
  static async ensureAPUserProperAssignment(apUserId: string, locationId: string) {
    try {
      console.log(`Ensuring proper assignment for AP user ${apUserId} to location ${locationId}`);

      // 1. Create/update ap_user_location_assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('ap_user_location_assignments')
        .upsert({
          ap_user_id: apUserId,
          location_id: locationId,
          assignment_role: 'provider',
          status: 'active'
        }, {
          onConflict: 'ap_user_id,location_id'
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // 2. Get AP user details
      const { data: apUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', apUserId)
        .single();

      if (userError) throw userError;

      // 3. Create/update authorized_providers record
      const { data: provider, error: providerError } = await supabase
        .from('authorized_providers')
        .upsert({
          user_id: apUserId,
          name: apUser.display_name || `Provider ${apUser.email}`,
          provider_type: 'authorized_partner',
          status: 'APPROVED',
          primary_location_id: locationId,
          contact_email: apUser.email,
          description: `Authorized Provider for ${apUser.display_name}`,
          performance_rating: 0,
          compliance_score: 0
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (providerError) throw providerError;

      console.log(`Successfully ensured assignment for ${apUser.display_name}`);

      return {
        assignment,
        provider,
        success: true
      };
    } catch (error) {
      console.error('Error ensuring AP user assignment:', error);
      throw error;
    }
  }

  /**
   * Get team-provider-location relationship health
   */
  static async getTeamProviderRelationshipHealth() {
    try {
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id, name, status, location_id, provider_id,
          locations(id, name, city, state),
          authorized_providers(id, name, status, user_id),
          team_members(id, status)
        `);

      if (teamsError) throw teamsError;

      const results: TeamProviderRelationship[] = [];

      for (const team of teams || []) {
        const issues: string[] = [];
        let assignmentStatus: 'complete' | 'partial' | 'missing';

        // Check location assignment
        const hasValidLocation = !!(team.location_id && team.locations);
        if (!hasValidLocation) {
          issues.push('Team has no valid location assignment');
        }

        // Check provider assignment
        const hasValidProvider = !!(team.provider_id && team.authorized_providers);
        if (!hasValidProvider) {
          issues.push('Team has no valid provider assignment');
        }

        // Check if provider's location matches team's location
        if (hasValidLocation && hasValidProvider) {
          const { data: providerLocation } = await supabase
            .from('authorized_providers')
            .select('primary_location_id')
            .eq('id', team.provider_id)
            .single();

          if (providerLocation?.primary_location_id !== team.location_id) {
            issues.push('Provider location does not match team location');
          }
        }

        // Determine status
        if (hasValidLocation && hasValidProvider && issues.length === 0) {
          assignmentStatus = 'complete';
        } else if (hasValidLocation || hasValidProvider) {
          assignmentStatus = 'partial';
        } else {
          assignmentStatus = 'missing';
        }

        // Check for active members
        const activeMembers = team.team_members?.filter(m => m.status === 'active') || [];
        if (activeMembers.length === 0) {
          issues.push('Team has no active members');
        }

        results.push({
          teamId: team.id,
          teamName: team.name,
          locationId: team.location_id || '',
          locationName: team.locations?.name || 'No Location',
          providerId: team.provider_id || '',
          providerName: team.authorized_providers?.name || 'No Provider',
          assignmentStatus,
          issues
        });
      }

      return results;
    } catch (error) {
      console.error('Error getting team provider relationship health:', error);
      throw error;
    }
  }

  /**
   * Auto-fix common assignment issues
   */
  static async autoFixAssignmentIssues() {
    const fixes = {
      apUserAssignments: 0,
      providerRecords: 0,
      teamAssignments: 0,
      errors: [] as string[]
    };

    try {
      // Fix AP user assignments
      const apStatus = await this.getAPUserAssignmentStatus();
      
      for (const user of apStatus) {
        if (user.assignmentStatus === 'partial' || user.assignmentStatus === 'missing') {
          try {
            // Find an available location for this user
            const { data: availableLocation } = await supabase
              .from('locations')
              .select('id')
              .limit(1)
              .single();

            if (availableLocation) {
              await this.ensureAPUserProperAssignment(user.userId, availableLocation.id);
              fixes.apUserAssignments++;
            }
          } catch (error: any) {
            fixes.errors.push(`Failed to fix assignment for ${user.displayName}: ${error.message}`);
          }
        }
      }

      // TODO: Add team assignment fixes based on team-provider relationship health

      return fixes;
    } catch (error: any) {
      fixes.errors.push(`Auto-fix failed: ${error.message}`);
      return fixes;
    }
  }

  /**
   * Get comprehensive system health report
   */
  static async getSystemHealthReport() {
    try {
      const [apStatus, teamHealth] = await Promise.all([
        this.getAPUserAssignmentStatus(),
        this.getTeamProviderRelationshipHealth()
      ]);

      const totalAPUsers = apStatus.length;
      const apUsersWithIssues = apStatus.filter(u => u.issues.length > 0).length;
      const totalTeams = teamHealth.length;
      const teamsWithIssues = teamHealth.filter(t => t.issues.length > 0).length;

      const overallScore = Math.round(
        ((totalAPUsers - apUsersWithIssues) + (totalTeams - teamsWithIssues)) / 
        (totalAPUsers + totalTeams) * 100
      );

      return {
        overallScore,
        summary: {
          totalAPUsers,
          apUsersWithIssues,
          totalTeams,
          teamsWithIssues,
          totalIssues: apUsersWithIssues + teamsWithIssues
        },
        apUserStatus: apStatus,
        teamHealth: teamHealth,
        recommendations: this.generateRecommendations(apStatus, teamHealth)
      };
    } catch (error) {
      console.error('Error generating system health report:', error);
      throw error;
    }
  }

  private static generateRecommendations(apStatus: any[], teamHealth: any[]): string[] {
    const recommendations: string[] = [];

    const apIssues = apStatus.filter(u => u.issues.length > 0);
    const teamIssues = teamHealth.filter(t => t.issues.length > 0);

    if (apIssues.length > 0) {
      recommendations.push(`Fix ${apIssues.length} AP user assignment issues`);
    }

    if (teamIssues.length > 0) {
      recommendations.push(`Resolve ${teamIssues.length} team-provider relationship issues`);
    }

    if (apIssues.some(u => u.assignmentStatus === 'missing')) {
      recommendations.push('Assign unassigned AP users to locations');
    }

    if (teamIssues.some(t => t.assignmentStatus === 'missing')) {
      recommendations.push('Assign teams to both locations and providers');
    }

    return recommendations;
  }
}