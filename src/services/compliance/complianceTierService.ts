import { supabase } from '@/integrations/supabase/client';
import { ComplianceRequirementsService } from './complianceRequirementsService';
import { ComplianceService } from './complianceService';
import { ComplianceMetric, UserComplianceRecord } from './complianceService'; // Import necessary types

export interface ComplianceTierInfo {
  tier: 'basic' | 'robust';
  template_name: string;
  description: string;
  total_requirements: number;
  completed_requirements: number;
  completion_percentage: number;
}

export interface TierSwitchResult {
  success: boolean;
  message: string;
  requirements_added: number;
  requirements_removed: number;
}

export class ComplianceTierService {
  
  /**
   * Assign compliance tier to user and apply appropriate requirements
   */
  static async assignComplianceTier(
    userId: string, 
    role: 'AP' | 'IC' | 'IP' | 'IT', 
    tier: 'basic' | 'robust'
  ): Promise<TierSwitchResult> {
    
    try {
      console.log(`DEBUG: Assigning ${tier} compliance tier to user ${userId} with role ${role}`);
      
      // Update user's compliance tier in profiles table
      // Cast the object to 'any' to bypass strict type checking for `compliance_tier`
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ compliance_tier: tier } as any)
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Assign the new tier's requirements to the user. This also clears old requirements.
      const assignedResult = await ComplianceRequirementsService.assignRoleRequirementsToUser(userId, role, tier);
      
      return {
        success: true,
        message: `Successfully assigned ${tier} compliance tier and updated requirements`,
        requirements_added: assignedResult.assigned_requirements.length,
        requirements_removed: 0 // Deletion logic is handled inside assignRoleRequirementsToUser via ComplianceService.deleteUserComplianceRecords
      };
      
    } catch (error) {
      console.error('Error assigning compliance tier:', error);
      return {
        success: false,
        message: `Failed to assign compliance tier: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requirements_added: 0,
        requirements_removed: 0
      };
    }
  }
  
  /**
   * Get user's current compliance tier information and progress
   */
  static async getUserComplianceTierInfo(userId: string): Promise<ComplianceTierInfo | null> {
    try {
      // Define local interface for profile data
      interface UserProfileData {
        compliance_tier: 'basic' | 'robust' | null;
        role: 'AP' | 'IC' | 'IP' | 'IT';
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('compliance_tier, role')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      if (!profile) return null; // User not found

      // Cast the profile data to our local interface for type safety
      // Cast the profile data to unknown first, then to our local interface for type safety
      const typedProfile: UserProfileData = profile as unknown as UserProfileData;
      
      const tier = typedProfile.compliance_tier || 'basic';
      const role = typedProfile.role;
      
      // Get template information
      const template = ComplianceRequirementsService.getRequirementsTemplateByTier(role, tier);
      
      if (!template) {
        console.warn(`No compliance template found for role ${role} and tier ${tier} for user ${userId}`);
        // Return default structure when template is missing
        return {
          tier: tier,
          template_name: `${role} - ${tier}`,
          description: `Compliance requirements for ${role} role on ${tier} tier`,
          total_requirements: 0,
          completed_requirements: 0,
          completion_percentage: 0
        };
      }
      
      // Get user's compliance records with requirement details
      const userRecords = await ComplianceService.getUserComplianceRecords(userId);
      
      // Filter records for current tier level and role
      const relevantRecords = userRecords.filter(record => {
        // For now, assume all records are relevant to the user's tier and role
        // In a more complex system, you'd check the requirement details
        return true;
      });

      const completedCount = relevantRecords.filter(record =>
        record.compliance_status === 'compliant'
      ).length;
      
      return {
        tier: tier,
        template_name: template.role_name,
        description: template.description,
        total_requirements: template.requirements.length,
        completed_requirements: completedCount,
        completion_percentage: template.requirements.length > 0 
          ? Math.round((completedCount / template.requirements.length) * 100)
          : 0
      };
      
    } catch (error) {
      console.error('Error getting user compliance tier info:', error);
      return null;
    }
  }
  
  /**
   * Switch user between compliance tiers.
   * This updates the profile and re-assigns requirements based on the new tier.
   */
  static async switchComplianceTier(
    userId: string,
    newTier: 'basic' | 'robust'
  ): Promise<TierSwitchResult> {
    
    try {
      // Get user's current role and tier
      interface UserProfileSwitch {
        role: 'AP' | 'IC' | 'IP' | 'IT';
        compliance_tier: 'basic' | 'robust' | null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, compliance_tier')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      if (!profile) throw new Error('User not found');
      
      // Cast the profile data to unknown first, then to our local interface for type safety
      const typedProfile: UserProfileSwitch = profile as unknown as UserProfileSwitch;

      const currentTier = typedProfile.compliance_tier || 'basic';
      const userRole = typedProfile.role;
      
      if (currentTier === newTier) {
        return {
          success: true,
          message: `User is already on ${newTier} tier`,
          requirements_added: 0,
          requirements_removed: 0
        };
      }
      
      console.log(`DEBUG: Switching user ${userId} from ${currentTier} to ${newTier} tier`);
      
      // Update compliance tier in the profile
      // Cast the object to 'any' to bypass strict type checking for `compliance_tier`
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ compliance_tier: newTier } as any)
        .eq('id', userId);
      
      if (updateError) throw updateError;

      // Update user requirements based on the new tier (this also handles deactivating old ones)
      await ComplianceRequirementsService.updateUserRoleRequirements(
        userId, 
        userRole, // old role (same)
        userRole, // new role (same)
        currentTier, 
        newTier
      );
      
      // Recalculate requirements added/removed for reporting
      const newRequirementsCount = (ComplianceRequirementsService.getRequirementsTemplateByTier(userRole, newTier)?.requirements.length || 0);
      const oldRequirementsCount = (ComplianceRequirementsService.getRequirementsTemplateByTier(userRole, currentTier)?.requirements.length || 0);

      return {
        success: true,
        message: `Successfully switched user ${userId} to ${newTier} tier`,
        requirements_added: newRequirementsCount,
        requirements_removed: oldRequirementsCount // Simplified for reporting
      };
      
    } catch (error) {
      console.error('Error switching compliance tier:', error);
      return {
        success: false,
        message: `Failed to switch compliance tier: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requirements_added: 0,
        requirements_removed: 0
      };
    }
  }
  
  /**
   * Get all users with their compliance tier information.
   * This is intended for admin/reporting dashboards.
   */
  static async getAllUsersComplianceTiers(): Promise<Array<{
    user_id: string;
    display_name: string;
    email: string;
    role: string;
    compliance_tier: 'basic' | 'robust';
    completion_percentage: number;
  }>> {
    try {
      // Define local interface for profile data
      interface UserProfileWithAllData {
        id: string;
        display_name: string | null;
        email: string | null;
        role: 'AP' | 'IC' | 'IP' | 'IT';
        compliance_tier: 'basic' | 'robust' | null;
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role, compliance_tier')
        .in('role', ['AP', 'IC', 'IP', 'IT']);
      
      if (error) throw error;
      
      const results: Array<{
        user_id: string;
        display_name: string;
        email: string;
        role: string;
        compliance_tier: 'basic' | 'robust';
        completion_percentage: number;
      }> = []; // Explicitly type the results array

      // Cast profiles data to unknown first, then to our local interface for type safety
      for (const profile of (profiles as unknown as UserProfileWithAllData[]) || []) {
        const tierInfo = await this.getUserComplianceTierInfo(profile.id);
        
        results.push({
          user_id: profile.id,
          display_name: profile.display_name || 'Unknown',
          email: profile.email || '',
          role: profile.role,
          compliance_tier: profile.compliance_tier || 'basic',
          completion_percentage: tierInfo?.completion_percentage || 0
        });
      }
      
      return results;
      
    } catch (error) {
      console.error('Error getting all users compliance tiers:', error);
      return [];
    }
  }
  
  /**
   * Get compliance tier statistics for reporting dashboards.
   */
  static async getComplianceTierStatistics(): Promise<{
    basic_tier_users: number;
    robust_tier_users: number;
    basic_completion_avg: number;
    robust_completion_avg: number;
  }> {
    try {
      const allUsers = await this.getAllUsersComplianceTiers(); // Uses the improved getAllUsersComplianceTiers

      const basicUsers = allUsers.filter(user => user.compliance_tier === 'basic');
      const robustUsers = allUsers.filter(user => user.compliance_tier === 'robust');
      
      const basicCompletionAvg = basicUsers.length > 0
        ? Math.round(basicUsers.reduce((sum, user) => sum + user.completion_percentage, 0) / basicUsers.length)
        : 0;
      
      const robustCompletionAvg = robustUsers.length > 0
        ? Math.round(robustUsers.reduce((sum, user) => sum + user.completion_percentage, 0) / robustUsers.length)
        : 0;
      
      return {
        basic_tier_users: basicUsers.length,
        robust_tier_users: robustUsers.length,
        basic_completion_avg: basicCompletionAvg,
        robust_completion_avg: robustCompletionAvg
      };
      
    } catch (error) {
      console.error('Error getting compliance tier statistics:', error);
      return {
        basic_tier_users: 0,
        robust_tier_users: 0,
        basic_completion_avg: 0,
        robust_completion_avg: 0
      };
    }
  }
}