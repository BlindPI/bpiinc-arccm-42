
import { supabase } from '@/integrations/supabase/client';
import { UnifiedProviderLocationService } from '@/services/provider/unifiedProviderLocationService';

export interface APUserAuditResult {
  userId: string;
  displayName: string;
  email: string;
  hasLocationAssignment: boolean;
  hasTeamMembership: boolean;
  isDualRole: boolean;
  locationAssignments: any[];
  teamMemberships: any[];
  issues: string[];
  recommendations: string[];
}

export interface TeamProviderAuditResult {
  teamId: string;
  teamName: string;
  hasProvider: boolean;
  hasLocation: boolean;
  providerValid: boolean;
  memberCount: number;
  issues: string[];
  recommendations: string[];
}

export interface DashboardIntegrityReport {
  apUserAudit: APUserAuditResult[];
  teamProviderAudit: TeamProviderAuditResult[];
  systemSummary: {
    totalAPUsers: number;
    apUsersWithIssues: number;
    totalTeams: number;
    teamsWithIssues: number;
    criticalIssues: number;
    warningIssues: number;
  };
  fixRecommendations: string[];
}

export class DashboardIntegrityService {
  static async auditAPUsers(): Promise<APUserAuditResult[]> {
    try {
      // Get all AP users
      const { data: apUsers, error: apUsersError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .eq('role', 'AP');

      if (apUsersError) throw apUsersError;

      const auditResults: APUserAuditResult[] = [];

      for (const user of apUsers || []) {
        // Check location assignments in ap_user_location_assignments table
        const { data: locationAssignments } = await supabase
          .from('ap_user_location_assignments')
          .select(`
            id, location_id, status, assignment_role,
            locations(id, name, city, state)
          `)
          .eq('ap_user_id', user.id)
          .eq('status', 'active');

        // ALSO check for assignments in authorized_providers table (primary system)
        const { data: providerAssignments } = await supabase
          .from('authorized_providers')
          .select(`
            id, primary_location_id, status,
            primary_location:locations!primary_location_id(id, name, city, state)
          `)
          .eq('user_id', user.id)
          .eq('status', 'APPROVED');

        // Check team memberships
        const { data: teamMemberships } = await supabase
          .from('team_members')
          .select(`
            id, team_id, role, status,
            teams(id, name, status)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active');

        const hasLocationAssignment = (locationAssignments?.length || 0) > 0;
        const hasProviderAssignment = (providerAssignments?.length || 0) > 0;
        const hasAnyLocationAssignment = hasLocationAssignment || hasProviderAssignment;
        const hasTeamMembership = (teamMemberships?.length || 0) > 0;
        const isDualRole = hasAnyLocationAssignment && hasTeamMembership;

        const issues: string[] = [];
        const recommendations: string[] = [];

        // Identify issues
        if (!hasAnyLocationAssignment && !hasTeamMembership) {
          issues.push('No location assignment or team membership found');
          recommendations.push('Assign to a location or add to a team');
        }

        if (isDualRole) {
          issues.push('User has both location assignment and team membership (potential conflict)');
          recommendations.push('Review role conflicts - AP users typically manage locations, not participate in teams');
        }

        // Check for data consistency issues between the two assignment systems
        if (hasLocationAssignment && hasProviderAssignment) {
          // Check if assignments are consistent
          const locationIds = locationAssignments?.map(a => a.location_id) || [];
          const providerLocationIds = providerAssignments?.map(a => a.primary_location_id) || [];
          const hasInconsistency = !locationIds.every(id => providerLocationIds.includes(id)) ||
                                  !providerLocationIds.every(id => locationIds.includes(id));
          
          if (hasInconsistency) {
            issues.push('Inconsistent assignments between AP user assignments and provider records');
            recommendations.push('Synchronize ap_user_location_assignments with authorized_providers table');
          }
        } else if (hasProviderAssignment && !hasLocationAssignment) {
          issues.push('Provider assignment exists but missing corresponding AP user location assignment');
          recommendations.push('Create matching entries in ap_user_location_assignments table');
        } else if (hasLocationAssignment && !hasProviderAssignment) {
          issues.push('AP user location assignment exists but missing authorized provider record');
          recommendations.push('Create matching authorized provider record');
        }

        if (hasLocationAssignment) {
          // Check if location assignments are complete
          const incompleteAssignments = locationAssignments?.filter(a => !a.locations) || [];
          if (incompleteAssignments.length > 0) {
            issues.push('Some location assignments point to non-existent locations');
            recommendations.push('Clean up orphaned location assignments');
          }
        }

        if (hasProviderAssignment) {
          // Check if provider assignments are complete
          const incompleteProviderAssignments = providerAssignments?.filter(a => !a.primary_location) || [];
          if (incompleteProviderAssignments.length > 0) {
            issues.push('Some authorized provider records point to non-existent locations');
            recommendations.push('Clean up orphaned provider location references');
          }
        }

        // Combine all assignments for reporting
        const allLocationAssignments = [
          ...(locationAssignments || []),
          ...(providerAssignments?.map(p => ({
            id: p.id,
            location_id: p.primary_location_id,
            status: p.status,
            assignment_role: 'provider',
            locations: p.primary_location
          })) || [])
        ];

        auditResults.push({
          userId: user.id,
          displayName: user.display_name,
          email: user.email,
          hasLocationAssignment: hasAnyLocationAssignment,
          hasTeamMembership,
          isDualRole,
          locationAssignments: allLocationAssignments,
          teamMemberships: teamMemberships || [],
          issues,
          recommendations
        });
      }

      return auditResults;
    } catch (error) {
      console.error('Error auditing AP users:', error);
      throw error;
    }
  }

  static async auditTeamProviderRelationships(): Promise<TeamProviderAuditResult[]> {
    try {
      // Get all teams with their relationships
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id, name, status, provider_id, location_id,
          locations(id, name),
          authorized_providers(id, name, status)
        `);

      if (teamsError) throw teamsError;

      const auditResults: TeamProviderAuditResult[] = [];

      for (const team of teams || []) {
        // Get member count
        const { data: members } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', team.id)
          .eq('status', 'active');

        const memberCount = members?.length || 0;
        const hasProvider = !!team.provider_id;
        const hasLocation = !!team.location_id;
        const providerValid = hasProvider && !!team.authorized_providers;

        const issues: string[] = [];
        const recommendations: string[] = [];

        // Identify issues
        if (!hasProvider) {
          issues.push('Team has no assigned provider');
          recommendations.push('Assign an authorized provider or mark as self-managed');
        } else if (!providerValid) {
          issues.push('Team provider assignment points to non-existent provider');
          recommendations.push('Fix orphaned provider reference');
        }

        if (!hasLocation) {
          issues.push('Team has no assigned location');
          recommendations.push('Assign team to a location for proper regional management');
        } else if (!team.locations) {
          issues.push('Team location assignment points to non-existent location');
          recommendations.push('Fix orphaned location reference');
        }

        if (memberCount === 0) {
          issues.push('Team has no active members');
          recommendations.push('Add members to team or mark as inactive');
        }

        if (team.status !== 'active' && memberCount > 0) {
          issues.push('Inactive team still has active members');
          recommendations.push('Review team status vs member status consistency');
        }

        auditResults.push({
          teamId: team.id,
          teamName: team.name,
          hasProvider,
          hasLocation,
          providerValid,
          memberCount,
          issues,
          recommendations
        });
      }

      return auditResults;
    } catch (error) {
      console.error('Error auditing team provider relationships:', error);
      throw error;
    }
  }

  static async generateIntegrityReport(): Promise<DashboardIntegrityReport> {
    try {
      const [apUserAudit, teamProviderAudit] = await Promise.all([
        this.auditAPUsers(),
        this.auditTeamProviderRelationships()
      ]);

      const apUsersWithIssues = apUserAudit.filter(u => u.issues.length > 0).length;
      const teamsWithIssues = teamProviderAudit.filter(t => t.issues.length > 0).length;

      // Count critical vs warning issues
      let criticalIssues = 0;
      let warningIssues = 0;

      apUserAudit.forEach(user => {
        user.issues.forEach(issue => {
          if (issue.includes('No location assignment') || issue.includes('non-existent')) {
            criticalIssues++;
          } else {
            warningIssues++;
          }
        });
      });

      teamProviderAudit.forEach(team => {
        team.issues.forEach(issue => {
          if (issue.includes('no assigned') || issue.includes('non-existent')) {
            criticalIssues++;
          } else {
            warningIssues++;
          }
        });
      });

      // Generate fix recommendations
      const fixRecommendations: string[] = [];

      if (apUsersWithIssues > 0) {
        fixRecommendations.push(`${apUsersWithIssues} AP users need location assignments or role clarification`);
      }

      if (teamsWithIssues > 0) {
        fixRecommendations.push(`${teamsWithIssues} teams need provider or location assignments`);
      }

      if (criticalIssues > 0) {
        fixRecommendations.push('Critical: Fix orphaned references and missing assignments immediately');
      }

      return {
        apUserAudit,
        teamProviderAudit,
        systemSummary: {
          totalAPUsers: apUserAudit.length,
          apUsersWithIssues,
          totalTeams: teamProviderAudit.length,
          teamsWithIssues,
          criticalIssues,
          warningIssues
        },
        fixRecommendations
      };
    } catch (error) {
      console.error('Error generating integrity report:', error);
      throw error;
    }
  }

  static async autoFixAPUserAssignments(): Promise<{ fixed: number; errors: string[] }> {
    let fixed = 0;
    const errors: string[] = [];

    try {
      const apUserAudit = await this.auditAPUsers();
      
      for (const user of apUserAudit) {
        if (!user.hasLocationAssignment && !user.hasTeamMembership) {
          try {
            // Try to find a location without an AP assignment
            const { data: availableLocations } = await supabase
              .from('locations')
              .select(`
                id, name,
                ap_user_location_assignments!inner(id)
              `)
              .is('ap_user_location_assignments.id', null)
              .limit(1);

            if (availableLocations && availableLocations.length > 0) {
              const location = availableLocations[0];
              
              // Assign AP user to location
              const { error: assignError } = await supabase
                .from('ap_user_location_assignments')
                .insert({
                  ap_user_id: user.userId,
                  location_id: location.id,
                  assignment_role: 'provider',
                  status: 'active'
                });

              if (!assignError) {
                fixed++;
                console.log(`Auto-assigned AP user ${user.displayName} to location ${location.name}`);
              } else {
                errors.push(`Failed to assign ${user.displayName}: ${assignError.message}`);
              }
            }
          } catch (error: any) {
            errors.push(`Error processing ${user.displayName}: ${error.message}`);
          }
        }
      }

      return { fixed, errors };
    } catch (error: any) {
      return { fixed, errors: [error.message] };
    }
  }

  static async autoFixTeamProviderRelationships(): Promise<{ fixed: number; errors: string[] }> {
    let fixed = 0;
    const errors: string[] = [];

    try {
      const teamAudit = await this.auditTeamProviderRelationships();
      
      for (const team of teamAudit) {
        if (!team.hasProvider && team.memberCount > 0) {
          try {
            // Try to find an AP user in the same location
            const { data: teamLocation } = await supabase
              .from('teams')
              .select(`
                location_id,
                locations(
                  id,
                  ap_user_location_assignments(
                    ap_user_id,
                    profiles(id, display_name)
                  )
                )
              `)
              .eq('id', team.teamId)
              .single();

            if (teamLocation?.locations?.ap_user_location_assignments?.length > 0) {
              const apAssignment = teamLocation.locations.ap_user_location_assignments[0];
              
              // Create provider record if it doesn't exist
              const { data: existingProvider } = await supabase
                .from('authorized_providers')
                .select('id')
                .eq('user_id', apAssignment.ap_user_id)
                .single();

              let providerId = existingProvider?.id;

              if (!providerId) {
                const { data: newProvider, error: providerError } = await supabase
                  .from('authorized_providers')
                  .insert({
                    user_id: apAssignment.ap_user_id,
                    name: 'Auto-assigned Provider',
                    provider_type: 'location_based',
                    status: 'APPROVED',
                    primary_location_id: teamLocation.location_id
                  })
                  .select('id')
                  .single();

                if (providerError) {
                  errors.push(`Failed to create provider for team ${team.teamName}: ${providerError.message}`);
                  continue;
                }

                providerId = newProvider.id;
              }

              // Assign provider to team
              const { error: assignError } = await supabase
                .from('teams')
                .update({ provider_id: providerId })
                .eq('id', team.teamId);

              if (!assignError) {
                fixed++;
                console.log(`Auto-assigned provider to team ${team.teamName}`);
              } else {
                errors.push(`Failed to assign provider to team ${team.teamName}: ${assignError.message}`);
              }
            }
          } catch (error: any) {
            errors.push(`Error processing team ${team.teamName}: ${error.message}`);
          }
        }
      }

      return { fixed, errors };
    } catch (error: any) {
      return { fixed, errors: [error.message] };
    }
  }
  // Instance methods for the UI component - Using Unified Provider Location Service
  async performFullAudit(): Promise<any> {
    try {
      console.log('🔍 Running unified provider location audit...');
      
      // Use the unified service that understands the complete business logic
      const healthReport = await UnifiedProviderLocationService.getSystemHealthReport();
      
      // Transform to match UI expectations
      const issues = [];
      const recommendations = [...healthReport.recommendations];

      // Process AP user issues
      healthReport.apUserStatus.forEach(user => {
        user.issues.forEach(issue => {
          let severity = 'warning';
          if (issue.includes('missing') || issue.includes('No location') || issue.includes('inconsistent')) {
            severity = 'critical';
          }
          
          issues.push({
            type: 'AP User Assignment',
            description: `${user.displayName}: ${issue}`,
            severity,
            count: 1
          });
        });
      });

      // Process team relationship issues
      healthReport.teamHealth.forEach(team => {
        team.issues.forEach(issue => {
          let severity = 'warning';
          if (issue.includes('no valid') || issue.includes('does not match')) {
            severity = 'critical';
          }
          
          issues.push({
            type: 'Team Provider Relationship',
            description: `${team.teamName}: ${issue}`,
            severity,
            count: 1
          });
        });
      });

      console.log('✅ Unified audit complete:', {
        overallScore: healthReport.overallScore,
        totalIssues: issues.length,
        apUsers: healthReport.summary.totalAPUsers,
        teams: healthReport.summary.totalTeams
      });

      return {
        overallScore: healthReport.overallScore,
        summary: {
          totalUsers: healthReport.summary.totalAPUsers,
          totalTeams: healthReport.summary.totalTeams,
          totalIssues: issues.length,
          criticalIssues: issues.filter(i => i.severity === 'critical').length,
          warningIssues: issues.filter(i => i.severity === 'warning').length
        },
        issues,
        recommendations,
        rawReport: healthReport // Keep original for reference
      };
    } catch (error) {
      console.error('❌ Error performing unified audit:', error);
      throw error;
    }
  }
  
  async autoFixIssues(): Promise<any> {
    try {
      console.log('🔧 Running unified auto-fix...');
      
      // Use the unified service's auto-fix capabilities
      const fixResults = await UnifiedProviderLocationService.autoFixAssignmentIssues();
      
      console.log('✅ Unified auto-fix complete:', fixResults);
      
      return {
        totalFixed: fixResults.apUserAssignments + fixResults.providerRecords + fixResults.teamAssignments,
        apUserFixes: fixResults.apUserAssignments,
        providerRecordFixes: fixResults.providerRecords,
        teamAssignmentFixes: fixResults.teamAssignments,
        errors: fixResults.errors,
        success: (fixResults.apUserAssignments + fixResults.providerRecords + fixResults.teamAssignments) > 0 || fixResults.errors.length === 0
      };
    } catch (error) {
      console.error('❌ Error in unified auto-fix:', error);
      throw error;
    }
  }
}
