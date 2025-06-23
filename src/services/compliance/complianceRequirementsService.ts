/**
 * PHASE 3: COMPLIANCE REQUIREMENTS MANAGEMENT
 * 
 * Establishes role-based compliance templates and default requirements
 * for AP (Authorized Provider), IC (Instructor Candidate), IP (Instructor Participant), IT (Instructor Trainee) roles
 * 
 * Key Features:
 * - Role-based compliance templates
 * - Default requirements for AP, IC, IP, IT roles
 * - Document requirements setup
 * - Custom compliance requirements management
 * - Automatic requirement assignment based on user roles
 * 
 * ✅ USES ONLY REAL DATA - No fake, demo, or placeholder data
 */

import { supabase } from '@/integrations/supabase/client';
import { ComplianceService } from './complianceService';
import type { ComplianceMetric, DocumentRequirement } from './complianceService';

// =====================================================================================
// INTERFACES
// =====================================================================================

export interface RoleComplianceTemplate {
  role: 'AP' | 'IC' | 'IP' | 'IT';
  role_name: string;
  description: string;
  requirements: ComplianceRequirementTemplate[];
}

export interface ComplianceRequirementTemplate {
  name: string;
  description: string;
  category: 'certification' | 'training' | 'documentation' | 'background_check' | 'continuing_education';
  measurement_type: 'boolean' | 'percentage' | 'date' | 'numeric';
  target_value: any;
  weight: number;
  is_required: boolean;
  renewal_period_days?: number;
  document_requirements?: {
    required_file_types: string[];
    max_file_size_mb: number;
    requires_expiry_date: boolean;
    auto_expire_days?: number;
    description: string;
  };
}

export interface UserRoleRequirements {
  user_id: string;
  role: string;
  assigned_requirements: ComplianceMetric[];
  setup_date: string;
  last_updated: string;
}

// =====================================================================================
// ROLE-BASED COMPLIANCE TEMPLATES
// =====================================================================================

const ROLE_COMPLIANCE_TEMPLATES: Record<string, RoleComplianceTemplate> = {
  AP: {
    role: 'AP',
    role_name: 'Authorized Provider',
    description: 'Compliance requirements for Authorized Providers managing training programs',
    requirements: [
      {
        name: 'Provider Authorization Certificate',
        description: 'Valid authorization certificate from regulatory body',
        category: 'certification',
        measurement_type: 'boolean',
        target_value: true,
        weight: 25,
        is_required: true,
        renewal_period_days: 365,
        document_requirements: {
          required_file_types: ['PDF', 'JPG', 'PNG'],
          max_file_size_mb: 10,
          requires_expiry_date: true,
          auto_expire_days: 365,
          description: 'Upload current provider authorization certificate'
        }
      },
      {
        name: 'Liability Insurance',
        description: 'Current liability insurance coverage',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 20,
        is_required: true,
        renewal_period_days: 365,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 365,
          description: 'Upload current liability insurance policy'
        }
      },
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 20,
        is_required: true,
        renewal_period_days: 1095, // 3 years
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 1095,
          description: 'Upload current background check report'
        }
      },
      {
        name: 'Provider Training Completion',
        description: 'Completion of provider training program',
        category: 'training',
        measurement_type: 'boolean',
        target_value: true,
        weight: 15,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload provider training completion certificate'
        }
      },
      {
        name: 'Annual Provider Report',
        description: 'Annual compliance and performance report',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 10,
        is_required: true,
        renewal_period_days: 365,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 10,
          requires_expiry_date: false,
          description: 'Upload annual provider compliance report'
        }
      },
      {
        name: 'Continuing Education Credits',
        description: 'Annual continuing education requirements',
        category: 'continuing_education',
        measurement_type: 'numeric',
        target_value: 20,
        weight: 10,
        is_required: true,
        renewal_period_days: 365,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload continuing education certificates'
        }
      }
    ]
  },
  IC: {
    role: 'IC',
    role_name: 'Instructor - Certified',
    description: 'Compliance requirements for Instructor - Certified preparing for certification',
    requirements: [
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 25,
        is_required: true,
        renewal_period_days: 1095, // 3 years
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 1095,
          description: 'Upload current background check report'
        }
      },
      {
        name: 'Basic Training Course',
        description: 'Completion of basic instructor training course',
        category: 'training',
        measurement_type: 'boolean',
        target_value: true,
        weight: 30,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload basic training completion certificate'
        }
      },
      {
        name: 'Teaching Practice Hours',
        description: 'Required teaching practice hours under supervision',
        category: 'training',
        measurement_type: 'numeric',
        target_value: 40,
        weight: 25,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload teaching hours log and supervisor evaluation'
        }
      },
      {
        name: 'CPR/First Aid Certification',
        description: 'Current CPR and First Aid certification',
        category: 'certification',
        measurement_type: 'boolean',
        target_value: true,
        weight: 15,
        is_required: true,
        renewal_period_days: 730, // 2 years
        document_requirements: {
          required_file_types: ['PDF', 'JPG', 'PNG'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 730,
          description: 'Upload current CPR/First Aid certificate'
        }
      },
      {
        name: 'Written Examination',
        description: 'Pass written instructor examination',
        category: 'certification',
        measurement_type: 'percentage',
        target_value: 80,
        weight: 5,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload examination results'
        }
      }
    ]
  },
  IP: {
    role: 'IP',
    role_name: 'Instructor - Provisional',
    description: 'Compliance requirements for Instructor - Provisional in training programs',
    requirements: [
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 30,
        is_required: true,
        renewal_period_days: 1095, // 3 years
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 1095,
          description: 'Upload current background check report'
        }
      },
      {
        name: 'Participation Training',
        description: 'Completion of participant training program',
        category: 'training',
        measurement_type: 'boolean',
        target_value: true,
        weight: 35,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload participation training completion certificate'
        }
      },
      {
        name: 'Practical Assessment',
        description: 'Pass practical skills assessment',
        category: 'certification',
        measurement_type: 'percentage',
        target_value: 75,
        weight: 20,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload practical assessment results'
        }
      },
      {
        name: 'CPR/First Aid Certification',
        description: 'Current CPR and First Aid certification',
        category: 'certification',
        measurement_type: 'boolean',
        target_value: true,
        weight: 15,
        is_required: true,
        renewal_period_days: 730, // 2 years
        document_requirements: {
          required_file_types: ['PDF', 'JPG', 'PNG'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 730,
          description: 'Upload current CPR/First Aid certificate'
        }
      }
    ]
  },
  IT: {
    role: 'IT',
    role_name: 'Instructor - Trainee',
    description: 'Compliance requirements for Instructor Trainees beginning their training journey',
    requirements: [
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 40,
        is_required: true,
        renewal_period_days: 1095, // 3 years
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 1095,
          description: 'Upload current background check report'
        }
      },
      {
        name: 'Orientation Training',
        description: 'Completion of orientation training program',
        category: 'training',
        measurement_type: 'boolean',
        target_value: true,
        weight: 40,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload orientation training completion certificate'
        }
      },
      {
        name: 'Basic Safety Training',
        description: 'Completion of basic safety training',
        category: 'training',
        measurement_type: 'boolean',
        target_value: true,
        weight: 20,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload safety training completion certificate'
        }
      }
    ]
  }
};

// =====================================================================================
// COMPLIANCE REQUIREMENTS SERVICE
// =====================================================================================

export class ComplianceRequirementsService {
  
  /**
   * Initialize default compliance requirements for all roles
   * Creates compliance metrics and document requirements in the database
   */
  static async initializeDefaultRequirements(): Promise<void> {
    try {
      console.log('DEBUG: Initializing default compliance requirements for AP, IC, IP, IT roles');
      
      for (const [roleKey, template] of Object.entries(ROLE_COMPLIANCE_TEMPLATES)) {
        console.log(`DEBUG: Setting up requirements for role: ${template.role_name}`);
        
        for (const requirement of template.requirements) {
          try {
            // Create compliance metric
            const metric = await ComplianceService.upsertComplianceMetric({
              name: requirement.name,
              description: requirement.description,
              category: requirement.category,
              required_for_roles: [template.role],
              measurement_type: requirement.measurement_type,
              target_value: requirement.target_value,
              weight: requirement.weight,
              is_active: true
            });
            
            console.log(`DEBUG: Created compliance metric: ${requirement.name} for role ${template.role}`);
            
            // Create document requirement if specified
            if (requirement.document_requirements) {
              await ComplianceService.createDocumentRequirement({
                metric_id: metric.id,
                document_type: requirement.category,
                required_file_types: requirement.document_requirements.required_file_types,
                max_file_size_mb: requirement.document_requirements.max_file_size_mb,
                requires_expiry_date: requirement.document_requirements.requires_expiry_date,
                auto_expire_days: requirement.document_requirements.auto_expire_days,
                description: requirement.document_requirements.description
              });
              
              console.log(`DEBUG: Created document requirement for: ${requirement.name}`);
            }
            
          } catch (error) {
            console.error(`Error creating requirement ${requirement.name} for role ${template.role}:`, error);
            // Continue with other requirements
          }
        }
      }
      
      console.log('DEBUG: Successfully initialized default compliance requirements');
    } catch (error) {
      console.error('Error initializing default compliance requirements:', error);
      throw error;
    }
  }
  
  /**
   * Get compliance requirements template for a specific role
   */
  static getRequirementsTemplate(role: 'AP' | 'IC' | 'IP' | 'IT'): RoleComplianceTemplate | null {
    return ROLE_COMPLIANCE_TEMPLATES[role] || null;
  }
  
  /**
   * Get all available role templates
   */
  static getAllRoleTemplates(): RoleComplianceTemplate[] {
    return Object.values(ROLE_COMPLIANCE_TEMPLATES);
  }
  
  /**
   * Assign role-based requirements to a user
   * Sets up compliance tracking for the user based on their role
   */
  static async assignRoleRequirementsToUser(userId: string, userRole: string): Promise<UserRoleRequirements> {
    try {
      console.log(`DEBUG: Assigning role requirements to user ${userId} with role ${userRole}`);
      
      // Get requirements for the user's role
      const requirements = await ComplianceService.getComplianceMetricsForRole(userRole);
      
      if (requirements.length === 0) {
        console.log(`DEBUG: No requirements found for role ${userRole}`);
        return {
          user_id: userId,
          role: userRole,
          assigned_requirements: [],
          setup_date: new Date().toISOString(),
          last_updated: new Date().toISOString()
        };
      }
      
      console.log(`DEBUG: Found ${requirements.length} requirements for role ${userRole}`);
      
      // Create initial compliance records for each requirement
      for (const requirement of requirements) {
        try {
          await ComplianceService.updateComplianceRecord(
            userId,
            requirement.id,
            null, // No initial value
            'pending', // Initial status
            `Initial setup for role ${userRole}`
          );
          
          console.log(`DEBUG: Created compliance record for ${requirement.name}`);
        } catch (error) {
          console.error(`Error creating compliance record for ${requirement.name}:`, error);
          // Continue with other requirements
        }
      }
      
      return {
        user_id: userId,
        role: userRole,
        assigned_requirements: requirements,
        setup_date: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error assigning role requirements to user:', error);
      throw error;
    }
  }
  
  /**
   * Update user role requirements when role changes
   */
  static async updateUserRoleRequirements(userId: string, oldRole: string, newRole: string): Promise<void> {
    try {
      console.log(`DEBUG: Updating user ${userId} role requirements from ${oldRole} to ${newRole}`);
      
      // Get current user compliance records
      const currentRecords = await ComplianceService.getUserComplianceRecords(userId);
      
      // Get new role requirements
      const newRequirements = await ComplianceService.getComplianceMetricsForRole(newRole);
      
      // Remove old role-specific requirements (mark as inactive)
      const oldRequirements = await ComplianceService.getComplianceMetricsForRole(oldRole);
      const oldRequirementIds = oldRequirements.map(r => r.id);
      
      for (const record of currentRecords) {
        if (oldRequirementIds.includes(record.metric_id)) {
          // Mark old requirement as completed/inactive
          await ComplianceService.updateComplianceRecord(
            userId,
            record.metric_id,
            record.current_value,
            'compliant', // Mark as completed since role changed
            `Role changed from ${oldRole} to ${newRole} - requirement no longer applicable`
          );
        }
      }
      
      // Add new role requirements
      for (const requirement of newRequirements) {
        const existingRecord = currentRecords.find(r => r.metric_id === requirement.id);
        
        if (!existingRecord) {
          await ComplianceService.updateComplianceRecord(
            userId,
            requirement.id,
            null,
            'pending',
            `New requirement for role ${newRole}`
          );
          
          console.log(`DEBUG: Added new requirement ${requirement.name} for role ${newRole}`);
        }
      }
      
      console.log(`DEBUG: Successfully updated role requirements for user ${userId}`);
    } catch (error) {
      console.error('Error updating user role requirements:', error);
      throw error;
    }
  }
  
  /**
   * Get role-specific compliance statistics
   */
  static async getRoleComplianceStatistics(): Promise<Array<{
    role: string;
    total_users: number;
    compliant_users: number;
    compliance_rate: number;
    common_issues: string[];
  }>> {
    try {
      const roles = ['AP', 'IC', 'IP', 'IT'];
      const statistics = [];
      
      for (const role of roles) {
        // Get users with this role
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', role);
        
        if (usersError) {
          console.error(`Error fetching users for role ${role}:`, usersError);
          continue;
        }
        
        const totalUsers = users?.length || 0;
        let compliantUsers = 0;
        
        // Calculate compliance for each user
        for (const user of users || []) {
          try {
            const summary = await ComplianceService.getUserComplianceSummary(user.id);
            if (summary.overall_score >= 90) {
              compliantUsers++;
            }
          } catch (error) {
            console.error(`Error getting compliance summary for user ${user.id}:`, error);
          }
        }
        
        const complianceRate = totalUsers > 0 ? Math.round((compliantUsers / totalUsers) * 100) : 0;
        
        statistics.push({
          role,
          total_users: totalUsers,
          compliant_users: compliantUsers,
          compliance_rate: complianceRate,
          common_issues: [] // TODO: Implement common issues analysis
        });
      }
      
      return statistics;
    } catch (error) {
      console.error('Error getting role compliance statistics:', error);
      return [];
    }
  }
  
  /**
   * Create custom compliance requirement for organization
   */
  static async createCustomRequirement(
    organizationId: string,
    requirement: Partial<ComplianceRequirementTemplate>,
    applicableRoles: string[]
  ): Promise<ComplianceMetric> {
    try {
      console.log(`DEBUG: Creating custom requirement for organization ${organizationId}`);
      
      const metric = await ComplianceService.upsertComplianceMetric({
        name: requirement.name || 'Custom Requirement',
        description: requirement.description || 'Custom organizational requirement',
        category: requirement.category || 'documentation',
        required_for_roles: applicableRoles,
        measurement_type: requirement.measurement_type || 'boolean',
        target_value: requirement.target_value || true,
        weight: requirement.weight || 10,
        is_active: true
      });
      
      // Create document requirement if specified
      if (requirement.document_requirements) {
        await ComplianceService.createDocumentRequirement({
          metric_id: metric.id,
          document_type: requirement.category || 'documentation',
          required_file_types: requirement.document_requirements.required_file_types,
          max_file_size_mb: requirement.document_requirements.max_file_size_mb,
          requires_expiry_date: requirement.document_requirements.requires_expiry_date,
          auto_expire_days: requirement.document_requirements.auto_expire_days,
          description: requirement.document_requirements.description
        });
      }
      
      console.log(`DEBUG: Created custom requirement: ${metric.name}`);
      return metric;
    } catch (error) {
      console.error('Error creating custom requirement:', error);
      throw error;
    }
  }
}