/**
 * Unified Provider Location Service - Single Source of Truth
 * Handles all Provider → Location → Team assignments through one interface
 * Replaces fragmented assignment systems with unified business logic
 */

import { supabase } from '@/integrations/supabase/client';

// Unified Types
export interface UnifiedAssignmentStatus {
  apUserId: string;
  displayName: string;
  email: string;
  assignments: LocationAssignment[];
  providerRecord: ProviderRecord | null;
  managedTeams: ManagedTeam[];
  overallStatus: 'complete' | 'partial' | 'missing' | 'conflict';
  issues: string[];
  recommendations: string[];
}

export interface LocationAssignment {
  id: string;
  locationId: string;
  locationName: string;
  isPrimary: boolean;
  assignmentRole: 'provider' | 'supervisor' | 'coordinator';
  status: 'active' | 'inactive';
  assignedAt: string;
}

export interface ProviderRecord {
  id: string;
  status: 'APPROVED' | 'INACTIVE';
  primaryLocationId: string;
  primaryLocationName: string;
  autoSynced: boolean;
}

export interface ManagedTeam {
  id: string;
  name: string;
  locationId: string;
  locationName: string;
  memberCount: number;
  status: 'active' | 'inactive';
}

export interface SystemHealthReport {
  overallScore: number;
  summary: {
    totalAPUsers: number;
    properlyAssigned: number;
    partiallyAssigned: number;
    unassigned: number;
    conflicts: number;
    totalTeams: number;
    teamsWithProviders: number;
    orphanedTeams: number;
  };
  apUserStatuses: UnifiedAssignmentStatus[];
  systemIssues: SystemIssue[];
  recommendations: string[];
}

export interface SystemIssue {
  type: 'assignment' | 'provider' | 'team';
  severity: 'critical' | 'warning';
  description: string;
  affectedId: string;
  affectedName: string;
  autoFixable: boolean;
}

export class UnifiedProviderLocationService {
  
  /**
   * Get unified assignment status for all AP users
   * This is the single source of truth for assignment data
   */
  static async getUnifiedAssignmentStatuses(): Promise<UnifiedAssignmentStatus[]> {
    try {
      console.log('🔍 Getting unified assignment statuses...');
      
      // For now, get data from individual tables until view is available
      const { data: apUsers, error: apError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .eq('role', 'AP');
      
      if (apError) throw apError;
      
      const userStatuses: UnifiedAssignmentStatus[] = [];
      
      for (const user of apUsers || []) {
        // Get assignments for this user
        const { data: assignments } = await supabase
          .from('ap_user_location_assignments')
          .select(`
            id, location_id, is_primary, assignment_role, status, assigned_at,
            locations(id, name)
          `)
          .eq('ap_user_id', user.id);
        
        // Get provider record for this user
        const { data: providerRecord } = await supabase
          .from('authorized_providers')
          .select('id, status, primary_location_id')
          .eq('user_id', user.id)
          .single();
        
        const status: UnifiedAssignmentStatus = {
          apUserId: user.id,
          displayName: user.display_name,
          email: user.email,
          assignments: (assignments || []).map(a => ({
            id: a.id,
            locationId: a.location_id,
            locationName: a.locations?.name || 'Unknown',
            isPrimary: a.is_primary,
            assignmentRole: a.assignment_role,
            status: a.status,
            assignedAt: a.assigned_at
          })),
          providerRecord: providerRecord ? {
            id: providerRecord.id,
            status: providerRecord.status,
            primaryLocationId: providerRecord.primary_location_id,
            primaryLocationName: 'Unknown', // Will be filled later
            autoSynced: true
          } : null,
          managedTeams: [], // Will be filled later
          overallStatus: 'missing',
          issues: [],
          recommendations: []
        };
        
        this.analyzeUserStatus(status);
        userStatuses.push(status);
      }
      
      console.log('✅ Unified assignment statuses retrieved:', userStatuses.length);
      return userStatuses;
      
      // Group by AP user and create unified status objects
      const userMap = new Map<string, UnifiedAssignmentStatus>();
      
      for (const row of unifiedData || []) {
        if (!userMap.has(row.ap_user_id)) {
          userMap.set(row.ap_user_id, {
            apUserId: row.ap_user_id,
            displayName: row.display_name,
            email: row.email,
            assignments: [],
            providerRecord: null,
            managedTeams: [],
            overallStatus: 'missing',
            issues: [],
            recommendations: []
          });
        }
        
        const status = userMap.get(row.ap_user_id)!;
        
        // Add assignment if exists
        if (row.location_id) {
          status.assignments.push({
            id: `${row.ap_user_id}-${row.location_id}`,
            locationId: row.location_id,
            locationName: row.location_name,
            isPrimary: row.is_primary,
            assignmentRole: row.assignment_role,
            status: row.assignment_status,
            assignedAt: new Date().toISOString() // Placeholder
          });
        }
        
        // Add provider record if exists
        if (row.provider_id) {
          status.providerRecord = {
            id: row.provider_id,
            status: row.provider_status,
            primaryLocationId: row.location_id,
            primaryLocationName: row.location_name,
            autoSynced: true
          };
        }
        
        // Add managed teams count
        if (row.managed_teams_count > 0) {
          // We'll get detailed team info separately to avoid query complexity
        }
      }
      
      // Analyze each user's status and add issues/recommendations
      for (const status of userMap.values()) {
        this.analyzeUserStatus(status);
      }
      
      console.log('✅ Unified assignment statuses retrieved:', userMap.size);
      return Array.from(userMap.values());
      
    } catch (error) {
      console.error('❌ Error getting unified assignment statuses:', error);
      throw error;
    }
  }
  
  /**
   * Assign AP user to location using unified approach
   * This is the single method for all AP user assignments
   */
  static async assignAPUserToLocation(
    apUserId: string, 
    locationId: string, 
    isPrimary: boolean = false,
    assignmentRole: 'provider' | 'supervisor' | 'coordinator' = 'provider'
  ): Promise<{ success: boolean; assignmentId: string; message: string }> {
    try {
      console.log(`🔧 Assigning AP user ${apUserId} to location ${locationId} (primary: ${isPrimary})`);
      
      // Use the unified assignment function
      const { data: assignmentId, error } = await supabase
        .rpc('assign_ap_user_unified', {
          p_ap_user_id: apUserId,
          p_location_id: locationId,
          p_is_primary: isPrimary,
          p_assignment_role: assignmentRole
        });
      
      if (error) throw error;
      
      // Triggers will automatically:
      // 1. Sync authorized_providers table
      // 2. Auto-assign teams at the location
      // 3. Update all related records
      
      console.log('✅ AP user assigned successfully, assignment ID:', assignmentId);
      
      return {
        success: true,
        assignmentId,
        message: `AP user assigned to location. Provider record and team assignments updated automatically.`
      };
      
    } catch (error: any) {
      console.error('❌ Error assigning AP user to location:', error);
      throw new Error(`Failed to assign AP user: ${error.message}`);
    }
  }
  
  /**
   * Create team with unified provider assignment
   * Ensures teams are properly linked to locations and providers
   */
  static async createTeamUnified(teamData: {
    name: string;
    description?: string;
    locationId: string;
    teamType?: string;
    selfManaged?: boolean;
  }): Promise<{ success: boolean; teamId: string; providerId?: string }> {
    try {
      console.log('🏗️ Creating team with unified provider assignment:', teamData);
      
      // Validate location exists
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('id', teamData.locationId)
        .single();
      
      if (locationError || !location) {
        throw new Error('Invalid location specified');
      }
      
      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          location_id: teamData.locationId,
          team_type: teamData.teamType || 'location_based',
          status: 'active',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select('id')
        .single();
      
      if (teamError) throw teamError;
      
      let providerId: string | undefined;
      
      if (!teamData.selfManaged) {
        // Auto-assign provider based on location
        const { data: locationProvider } = await supabase
          .from('authorized_providers')
          .select('id')
          .eq('primary_location_id', teamData.locationId)
          .eq('status', 'APPROVED')
          .single();
        
        if (locationProvider) {
          // Update team with provider
          await supabase
            .from('teams')
            .update({ provider_id: locationProvider.id })
            .eq('id', team.id);
          
          providerId = locationProvider.id;
          console.log('✅ Team auto-assigned to provider:', providerId);
        } else {
          console.warn('⚠️ No provider found for location, team created without provider');
        }
      }
      
      return {
        success: true,
        teamId: team.id,
        providerId
      };
      
    } catch (error: any) {
      console.error('❌ Error creating team:', error);
      throw new Error(`Failed to create team: ${error.message}`);
    }
  }
  
  /**
   * Get comprehensive system health report
   * Single source of truth for system status
   */
  static async getSystemHealthReport(): Promise<SystemHealthReport> {
    try {
      console.log('📊 Generating comprehensive system health report...');
      
      const [apUserStatuses, teamData] = await Promise.all([
        this.getUnifiedAssignmentStatuses(),
        this.getTeamAssignmentHealth()
      ]);
      
      // Calculate summary metrics
      const summary = {
        totalAPUsers: apUserStatuses.length,
        properlyAssigned: apUserStatuses.filter(u => u.overallStatus === 'complete').length,
        partiallyAssigned: apUserStatuses.filter(u => u.overallStatus === 'partial').length,
        unassigned: apUserStatuses.filter(u => u.overallStatus === 'missing').length,
        conflicts: apUserStatuses.filter(u => u.overallStatus === 'conflict').length,
        totalTeams: teamData.totalTeams,
        teamsWithProviders: teamData.teamsWithProviders,
        orphanedTeams: teamData.orphanedTeams
      };
      
      // Calculate overall health score
      const totalEntities = summary.totalAPUsers + summary.totalTeams;
      const healthyEntities = summary.properlyAssigned + summary.teamsWithProviders;
      const overallScore = totalEntities > 0 ? Math.round((healthyEntities / totalEntities) * 100) : 100;
      
      // Collect all system issues
      const systemIssues: SystemIssue[] = [];
      
      for (const status of apUserStatuses) {
        for (const issue of status.issues) {
          systemIssues.push({
            type: 'assignment',
            severity: status.overallStatus === 'conflict' ? 'critical' : 'warning',
            description: issue,
            affectedId: status.apUserId,
            affectedName: status.displayName,
            autoFixable: status.overallStatus !== 'conflict'
          });
        }
      }
      
      // Generate recommendations
      const recommendations = this.generateSystemRecommendations(summary, systemIssues);
      
      console.log('✅ System health report generated:', { overallScore, totalIssues: systemIssues.length });
      
      return {
        overallScore,
        summary,
        apUserStatuses,
        systemIssues,
        recommendations
      };
      
    } catch (error) {
      console.error('❌ Error generating system health report:', error);
      
      // Return minimal fallback report
      return {
        overallScore: 0,
        summary: {
          totalAPUsers: 0,
          properlyAssigned: 0,
          partiallyAssigned: 0,
          unassigned: 0,
          conflicts: 0,
          totalTeams: 0,
          teamsWithProviders: 0,
          orphanedTeams: 0
        },
        apUserStatuses: [],
        systemIssues: [{
          type: 'assignment',
          severity: 'critical',
          description: 'Unable to generate system health report',
          affectedId: 'system',
          affectedName: 'System',
          autoFixable: false
        }],
        recommendations: ['Check database connectivity', 'Verify unified_provider_assignments view exists']
      };
    }
  }
  
  /**
   * Auto-fix system issues using unified approach
   */
  static async autoFixSystemIssues(): Promise<{
    totalFixed: number;
    fixedAssignments: number;
    fixedProviders: number;
    fixedTeams: number;
    errors: string[];
  }> {
    const results = {
      totalFixed: 0,
      fixedAssignments: 0,
      fixedProviders: 0,
      fixedTeams: 0,
      errors: [] as string[]
    };
    
    try {
      console.log('🔧 Starting unified auto-fix process...');
      
      const statuses = await this.getUnifiedAssignmentStatuses();
      
      for (const status of statuses) {
        if (status.overallStatus === 'missing' || status.overallStatus === 'partial') {
          try {
            // Find an available location for this user
            const { data: availableLocation } = await supabase
              .from('locations')
              .select('id')
              .limit(1)
              .single();
            
            if (availableLocation) {
              await this.assignAPUserToLocation(status.apUserId, availableLocation.id, true);
              results.fixedAssignments++;
              results.totalFixed++;
            }
          } catch (error: any) {
            results.errors.push(`Failed to fix ${status.displayName}: ${error.message}`);
          }
        }
      }
      
      console.log('✅ Auto-fix completed:', results);
      return results;
      
    } catch (error: any) {
      results.errors.push(`Auto-fix failed: ${error.message}`);
      return results;
    }
  }
  
  // Private helper methods
  
  private static analyzeUserStatus(status: UnifiedAssignmentStatus): void {
    const hasAssignments = status.assignments.length > 0;
    const hasProviderRecord = !!status.providerRecord;
    const hasPrimaryAssignment = status.assignments.some(a => a.isPrimary);
    
    // Determine overall status
    if (hasAssignments && hasProviderRecord && hasPrimaryAssignment) {
      // Check for consistency
      const primaryAssignment = status.assignments.find(a => a.isPrimary);
      if (primaryAssignment && status.providerRecord?.primaryLocationId === primaryAssignment.locationId) {
        status.overallStatus = 'complete';
      } else {
        status.overallStatus = 'conflict';
        status.issues.push('Location assignments and provider record are inconsistent');
      }
    } else if (hasAssignments || hasProviderRecord) {
      status.overallStatus = 'partial';
      if (hasAssignments && !hasProviderRecord) {
        status.issues.push('Has location assignments but missing provider record');
      }
      if (!hasAssignments && hasProviderRecord) {
        status.issues.push('Has provider record but missing location assignments');
      }
      if (!hasPrimaryAssignment && hasAssignments) {
        status.issues.push('Has location assignments but no primary assignment');
      }
    } else {
      status.overallStatus = 'missing';
      status.issues.push('No location assignments or provider record found');
    }
    
    // Generate recommendations
    if (status.overallStatus === 'missing') {
      status.recommendations.push('Assign to a primary location');
    } else if (status.overallStatus === 'partial') {
      status.recommendations.push('Complete missing assignments or provider record');
    } else if (status.overallStatus === 'conflict') {
      status.recommendations.push('Resolve assignment conflicts');
    }
  }
  
  private static async getTeamAssignmentHealth(): Promise<{
    totalTeams: number;
    teamsWithProviders: number;
    orphanedTeams: number;
  }> {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, provider_id, location_id');
    
    if (error) throw error;
    
    const totalTeams = teams?.length || 0;
    const teamsWithProviders = teams?.filter(t => t.provider_id).length || 0;
    const orphanedTeams = teams?.filter(t => !t.provider_id && t.location_id).length || 0;
    
    return { totalTeams, teamsWithProviders, orphanedTeams };
  }
  
  private static generateSystemRecommendations(
    summary: SystemHealthReport['summary'], 
    issues: SystemIssue[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (summary.unassigned > 0) {
      recommendations.push(`Assign ${summary.unassigned} unassigned AP users to locations`);
    }
    
    if (summary.partiallyAssigned > 0) {
      recommendations.push(`Complete ${summary.partiallyAssigned} partial assignments`);
    }
    
    if (summary.conflicts > 0) {
      recommendations.push(`Resolve ${summary.conflicts} assignment conflicts`);
    }
    
    if (summary.orphanedTeams > 0) {
      recommendations.push(`Assign providers to ${summary.orphanedTeams} orphaned teams`);
    }
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    if (criticalIssues > 0) {
      recommendations.push(`Address ${criticalIssues} critical system issues immediately`);
    }
    
    return recommendations;
  }
}