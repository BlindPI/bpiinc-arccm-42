/**
 * Unified AP Dashboard Service
 * 
 * This service replaces the broken SimpleDashboardService for AP users
 * and uses the new unified database functions to ensure proper data access.
 * 
 * Created to fix the system-wide AP user data access failure caused by
 * recent migrations that changed access patterns without updating all services.
 */

import { supabase } from '@/integrations/supabase/client';

export interface APTeamData {
  team_id: string;
  team_name: string;
  access_type: string;
}

export interface APTeamMember {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  team_id: string;
  team_name: string;
}

export interface APLocation {
  location_id: string;
  location_name: string;
  access_source: string;
}

export interface APCertificate {
  certificate_id: string;
  user_id: string;
  user_name: string;
  certificate_type: string;
  certification_level: string;
  issue_date: string;
  expiry_date: string;
  location_id: string;
  location_name: string;
}

export interface APUserValidation {
  user_id: string;
  display_name: string;
  has_provider_record: boolean;
  has_team_assignments: boolean;
  has_team_memberships: boolean;
  setup_complete: boolean;
  issues: string;
}

export interface APDashboardSummary {
  total_teams: number;
  total_team_members: number;
  total_locations: number;
  total_certificates: number;
  setup_complete: boolean;
  validation_issues: string[];
}

class UnifiedAPDashboardService {
  /**
   * Get all teams accessible to the current AP user
   */
  async getAccessibleTeams(userId?: string): Promise<APTeamData[]> {
    try {
      const { data, error } = await supabase.rpc('get_ap_accessible_teams', {
        ap_user_id: userId || undefined
      });

      if (error) {
        console.error('Error fetching accessible teams:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get accessible teams:', error);
      return [];
    }
  }

  /**
   * Get all team members accessible to the current AP user
   */
  async getAccessibleTeamMembers(userId?: string): Promise<APTeamMember[]> {
    try {
      const { data, error } = await supabase.rpc('get_ap_accessible_team_members', {
        ap_user_id: userId || undefined
      });

      if (error) {
        console.error('Error fetching accessible team members:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get accessible team members:', error);
      return [];
    }
  }

  /**
   * Get all locations accessible to the current AP user
   */
  async getAccessibleLocations(userId?: string): Promise<APLocation[]> {
    try {
      const { data, error } = await supabase.rpc('get_ap_accessible_locations', {
        ap_user_id: userId || undefined
      });

      if (error) {
        console.error('Error fetching accessible locations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get accessible locations:', error);
      return [];
    }
  }

  /**
   * Get all certificates accessible to the current AP user by location
   */
  async getAccessibleCertificates(userId?: string): Promise<APCertificate[]> {
    try {
      const { data, error } = await supabase.rpc('get_ap_accessible_certificates', {
        ap_user_id: userId || undefined
      });

      if (error) {
        console.error('Error fetching accessible certificates:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get accessible certificates:', error);
      return [];
    }
  }

  /**
   * Validate AP user setup to ensure proper data access
   */
  async validateAPUserSetup(userId?: string): Promise<APUserValidation[]> {
    try {
      const { data, error } = await supabase.rpc('validate_ap_user_setup', {
        check_user_id: userId || null
      });

      if (error) {
        console.error('Error validating AP user setup:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to validate AP user setup:', error);
      return [];
    }
  }

  /**
   * Get comprehensive dashboard summary for AP user
   */
  async getDashboardSummary(userId?: string): Promise<APDashboardSummary> {
    try {
      const [teams, members, locations, certificates, validation] = await Promise.all([
        this.getAccessibleTeams(userId),
        this.getAccessibleTeamMembers(userId),
        this.getAccessibleLocations(userId),
        this.getAccessibleCertificates(userId),
        this.validateAPUserSetup(userId)
      ]);

      const userValidation = validation.length > 0 ? validation[0] : null;
      const validationIssues = validation
        .filter(v => !v.setup_complete)
        .map(v => v.issues);

      return {
        total_teams: teams.length,
        total_team_members: members.length,
        total_locations: locations.length,
        total_certificates: certificates.length,
        setup_complete: userValidation?.setup_complete || false,
        validation_issues: validationIssues
      };
    } catch (error) {
      console.error('Failed to get dashboard summary:', error);
      return {
        total_teams: 0,
        total_team_members: 0,
        total_locations: 0,
        total_certificates: 0,
        setup_complete: false,
        validation_issues: ['Failed to load dashboard data']
      };
    }
  }

  /**
   * Get team overview data for AP user dashboard
   */
  async getTeamOverview(userId?: string) {
    try {
      const teams = await this.getAccessibleTeams(userId);
      const members = await this.getAccessibleTeamMembers(userId);

      // Group members by team
      const teamOverview = teams.map(team => {
        const teamMembers = members.filter(member => member.team_id === team.team_id);
        return {
          team_id: team.team_id,
          team_name: team.team_name,
          access_type: team.access_type,
          member_count: teamMembers.length,
          members: teamMembers
        };
      });

      return teamOverview;
    } catch (error) {
      console.error('Failed to get team overview:', error);
      return [];
    }
  }

  /**
   * Get certificate overview data by location for AP user dashboard
   */
  async getCertificateOverview(userId?: string) {
    try {
      const certificates = await this.getAccessibleCertificates(userId);
      const locations = await this.getAccessibleLocations(userId);

      // Group certificates by location
      const certificateOverview = locations.map(location => {
        const locationCertificates = certificates.filter(
          cert => cert.location_id === location.location_id
        );
        
        return {
          location_id: location.location_id,
          location_name: location.location_name,
          access_source: location.access_source,
          certificate_count: locationCertificates.length,
          certificates: locationCertificates
        };
      });

      return certificateOverview;
    } catch (error) {
      console.error('Failed to get certificate overview:', error);
      return [];
    }
  }

  /**
   * Check if current user is properly setup as AP user
   */
  async checkAPUserHealth(userId?: string): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const validation = await this.validateAPUserSetup(userId);
      const userValidation = validation.length > 0 ? validation[0] : null;

      if (!userValidation) {
        return {
          isHealthy: false,
          issues: ['User not found or not an AP user'],
          recommendations: ['Contact system administrator']
        };
      }

      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!userValidation.has_provider_record) {
        issues.push('Missing authorized_providers record');
        recommendations.push('Contact administrator to create provider record');
      }

      if (!userValidation.has_team_assignments) {
        issues.push('Missing provider_team_assignments');
        recommendations.push('Contact administrator to assign teams to your provider record');
      }

      if (!userValidation.has_team_memberships) {
        issues.push('Not assigned to any teams');
        recommendations.push('Contact administrator to add you to appropriate teams');
      }

      return {
        isHealthy: userValidation.setup_complete,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Failed to check AP user health:', error);
      return {
        isHealthy: false,
        issues: ['Failed to validate user setup'],
        recommendations: ['Try refreshing the page or contact support']
      };
    }
  }
}

// Export singleton instance
export const unifiedAPDashboardService = new UnifiedAPDashboardService();

// Export for backward compatibility and migration
export default unifiedAPDashboardService;