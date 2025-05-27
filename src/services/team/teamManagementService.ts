
import { TeamOperations } from './teamOperations';
import { LocationAssignmentService } from './locationAssignmentService';
import { PerformanceService } from './performanceService';
import type { 
  EnhancedTeam, 
  TeamMemberWithProfile, 
  TeamPerformanceMetric, 
  TeamLocationAssignment 
} from './types';

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
  }): Promise<EnhancedTeam> {
    return this.teamOps.createTeamWithLocation(teamData);
  }

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    return this.teamOps.getTeamsByLocation(locationId);
  }

  // Location assignment operations
  async assignTeamToLocation(
    teamId: string, 
    locationId: string, 
    assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'
  ): Promise<void> {
    return this.locationService.assignTeamToLocation(teamId, locationId, assignmentType);
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    return this.locationService.getTeamLocationAssignments(teamId);
  }

  async updateTeamMemberLocation(memberId: string, locationId: string, position?: string): Promise<void> {
    return this.locationService.updateTeamMemberLocation(memberId, locationId, position);
  }

  // Performance operations
  async recordTeamPerformance(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_by'>): Promise<void> {
    return this.performanceService.recordTeamPerformance(metric);
  }

  async getTeamPerformanceSummary(teamId: string, period: string = 'monthly'): Promise<any> {
    return this.performanceService.getTeamPerformanceSummary(teamId, period);
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
