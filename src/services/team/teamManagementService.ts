
import { TeamOperations } from './teamOperations';
import { LocationAssignmentService } from './locationAssignmentService';
import { PerformanceService } from './performanceService';
import { enhancedTeamManagementService } from './enhancedTeamManagementService';
import type { 
  TeamMemberWithProfile, 
  TeamPerformanceMetric, 
  TeamLocationAssignment 
} from './types';
import type { Team as EnhancedTeam } from '@/types/user-management';

export class TeamManagementService {
  private teamOps = new TeamOperations();
  private locationService = new LocationAssignmentService();
  private performanceService = new PerformanceService();

  // Team operations
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    return this.teamOps.getEnhancedTeams();
  }

  async createTeamWithLocation(teamData: {
    name: string;
    description?: string;
    location_id?: string;
    provider_id?: string;
    team_type?: string;
    created_by: string;
  }): Promise<EnhancedTeam> {
    return this.teamOps.createTeamWithLocation(teamData);
  }

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    return this.teamOps.getTeamsByLocation(locationId);
  }

  async getProviderTeams(providerId: string): Promise<EnhancedTeam[]> {
    return this.teamOps.getProviderTeams(providerId);
  }

  // Enhanced location assignment operations
  async assignTeamToLocation(
    teamId: string, 
    locationId: string, 
    assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'
  ): Promise<void> {
    return enhancedTeamManagementService.assignTeamToLocation(teamId, locationId, assignmentType);
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    const assignments = await enhancedTeamManagementService.getTeamLocationAssignments(teamId);
    // Ensure compatibility with the local type
    return assignments.map(assignment => ({
      ...assignment,
      location_name: assignment.location_name || 'Unknown Location'
    }));
  }

  async updateTeamMemberLocation(memberId: string, locationId: string, position?: string): Promise<void> {
    return this.locationService.updateTeamMemberLocation(memberId, locationId, position);
  }

  // Enhanced performance operations
  async recordTeamPerformance(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_by' | 'created_at' | 'recorded_date'>): Promise<void> {
    const enhancedMetric = {
      ...metric,
      recorded_by: '',
      recorded_date: new Date().toISOString()
    };
    return enhancedTeamManagementService.recordTeamPerformance(enhancedMetric);
  }

  async getTeamPerformanceSummary(teamId: string, period: string = 'monthly'): Promise<any> {
    return enhancedTeamManagementService.getTeamPerformanceSummary(teamId, period);
  }

  // Enhanced member management
  async getEnhancedTeamMembers(teamId: string) {
    return enhancedTeamManagementService.getEnhancedTeamMembers(teamId);
  }

  async updateTeamMemberDetails(memberId: string, updates: any) {
    return enhancedTeamManagementService.updateMemberDetails(memberId, updates);
  }

  async updateTeamMemberStatus(memberId: string, status: string, reason?: string) {
    return enhancedTeamManagementService.updateMemberStatus(memberId, status, reason);
  }

  // Workflow management
  async getTeamWorkflows(teamId: string) {
    return enhancedTeamManagementService.getTeamWorkflows(teamId);
  }

  async createWorkflow(workflow: any) {
    return enhancedTeamManagementService.createWorkflow(workflow);
  }

  async approveWorkflow(workflowId: string, approvedBy: string, approvalData?: any) {
    return enhancedTeamManagementService.approveWorkflow(workflowId, approvedBy, approvalData);
  }
}

export const teamManagementService = new TeamManagementService();

// Re-export types for convenience
export type { 
  EnhancedTeam, 
  TeamMemberWithProfile, 
  TeamPerformanceMetric, 
  TeamLocationAssignment 
};
