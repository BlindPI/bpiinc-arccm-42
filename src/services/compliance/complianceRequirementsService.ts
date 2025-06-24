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
  tier?: 'basic' | 'robust'; // Adding tier property
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

// Basic Compliance Templates (Document Requirements Only)
const BASIC_COMPLIANCE_TEMPLATES: Record<string, RoleComplianceTemplate> = {
  'AP_BASIC': {
    role: 'AP',
    tier: 'basic',
    role_name: 'Authorized Provider - Basic',
    description: 'Essential onboarding requirements for Authorized Providers',
    requirements: [
      {
        name: 'Resume Upload',
        description: 'Current resume demonstrating business experience',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 20,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload current resume with business experience'
        }
      },
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 50,
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
        name: 'Company Information Form',
        description: 'Basic company information and contact details',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 30,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Complete basic company information form'
        }
      }
    ]
  },

  'IC_BASIC': {
    role: 'IC',
    tier: 'basic',
    role_name: 'Instructor Certified - Basic',
    description: 'Essential requirements for certified instructors',
    requirements: [
      {
        name: 'Resume Upload',
        description: 'Current resume demonstrating teaching experience',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 30,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload current resume with teaching experience'
        }
      },
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 70,
        is_required: true,
        renewal_period_days: 1095, // 3 years
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 1095,
          description: 'Upload current background check report'
        }
      }
    ]
  },

  'IP_BASIC': {
    role: 'IP',
    tier: 'basic',
    role_name: 'Instructor Provisional - Basic',
    description: 'Essential requirements for provisional instructors',
    requirements: [
      {
        name: 'Resume Upload',
        description: 'Current resume demonstrating relevant experience',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 30,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload current resume with relevant experience'
        }
      },
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 70,
        is_required: true,
        renewal_period_days: 1095, // 3 years
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 1095,
          description: 'Upload current background check report'
        }
      }
    ]
  },

  'IT_BASIC': {
    role: 'IT',
    tier: 'basic',
    role_name: 'Instructor Trainee - Basic',
    description: 'Essential onboarding requirements for instructor trainees',
    requirements: [
      {
        name: 'Resume Upload',
        description: 'Current resume demonstrating relevant experience',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 25,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload current resume with relevant experience'
        }
      },
      {
        name: 'Contact Information Verification',
        description: 'Verified contact details including emergency contact',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 25,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'JPG', 'PNG'],
          max_file_size_mb: 2,
          requires_expiry_date: false,
          description: 'Upload verification of contact information'
        }
      },
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 50,
        is_required: true,
        renewal_period_days: 1095, // 3 years
        document_requirements: {
          required_file_types: ['PDF'],
          max_file_size_mb: 5,
          requires_expiry_date: true,
          auto_expire_days: 1095,
          description: 'Upload current background check report'
        }
      }
    ]
  }
};

// Robust Compliance Templates (Current + Document Requirements)
const ROBUST_COMPLIANCE_TEMPLATES: Record<string, RoleComplianceTemplate> = {
  'AP_ROBUST': {
    role: 'AP',
    tier: 'robust',
    role_name: 'Authorized Provider - Comprehensive',
    description: 'Full compliance requirements for Authorized Providers',
    requirements: [
      // NEW DOCUMENT REQUIREMENTS
      {
        name: 'Resume Upload',
        description: 'Current resume demonstrating business experience',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 5,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload current resume with business experience'
        }
      },
      {
        name: 'Company Information Form',
        description: 'Detailed company information and contact details',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 5,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Complete detailed company information form'
        }
      },
      
      // ALL EXISTING REQUIREMENTS (adjusted weights)
      {
        name: 'Provider Authorization Certificate',
        description: 'Valid authorization certificate from regulatory body',
        category: 'certification',
        measurement_type: 'boolean',
        target_value: true,
        weight: 22, // Reduced from 25
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
        weight: 18, // Reduced from 20
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
        weight: 18, // Reduced from 20
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
        weight: 13, // Reduced from 15
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
        weight: 9, // Reduced from 10
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
        weight: 10, // Same as before
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

  'IC_ROBUST': {
    role: 'IC',
    tier: 'robust',
    role_name: 'Instructor Certified - Comprehensive',
    description: 'Full compliance requirements for Instructor Certified',
    requirements: [
      // NEW DOCUMENT REQUIREMENT
      {
        name: 'Resume Upload',
        description: 'Updated resume demonstrating continued professional development',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 5,
        is_required: true,
        renewal_period_days: 365,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload current resume showing professional development'
        }
      },
      
      // ALL EXISTING REQUIREMENTS (adjusted weights)
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 24, // Reduced from 25
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
        weight: 28, // Reduced from 30
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
        weight: 23, // Reduced from 25
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
        weight: 15, // Same as before
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
        weight: 5, // Same as before
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

  'IP_ROBUST': {
    role: 'IP',
    tier: 'robust',
    role_name: 'Instructor Provisional - Comprehensive',
    description: 'Full compliance requirements for Instructor Provisional',
    requirements: [
      // NEW DOCUMENT REQUIREMENT
      {
        name: 'Resume Upload',
        description: 'Current resume demonstrating relevant experience',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 8,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload current resume with relevant training experience'
        }
      },
      
      // ALL EXISTING REQUIREMENTS (adjusted weights)
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 27, // Reduced from 30
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
        weight: 32, // Reduced from 35
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
        weight: 18, // Reduced from 20
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
        weight: 15, // Same as before
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

  'IT_ROBUST': {
    role: 'IT',
    tier: 'robust',
    role_name: 'Instructor Trainee - Comprehensive',
    description: 'Full compliance requirements for Instructor Trainees',
    requirements: [
      // NEW DOCUMENT REQUIREMENTS
      {
        name: 'Resume Upload',
        description: 'Current resume demonstrating relevant experience',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 10,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'DOC', 'DOCX'],
          max_file_size_mb: 5,
          requires_expiry_date: false,
          description: 'Upload current resume with relevant experience'
        }
      },
      {
        name: 'Contact Information Verification',
        description: 'Verified contact details including emergency contact',
        category: 'documentation',
        measurement_type: 'boolean',
        target_value: true,
        weight: 5,
        is_required: true,
        document_requirements: {
          required_file_types: ['PDF', 'JPG', 'PNG'],
          max_file_size_mb: 2,
          requires_expiry_date: false,
          description: 'Upload verification of contact information'
        }
      },
      
      // ALL EXISTING REQUIREMENTS (adjusted weights)
      {
        name: 'Background Check',
        description: 'Current background check clearance',
        category: 'background_check',
        measurement_type: 'boolean',
        target_value: true,
        weight: 35, // Reduced from 40
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
        weight: 35, // Reduced from 40
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
        weight: 15, // Reduced from 20
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
   * Initializes basic compliance requirements for all roles from templates.
   * This method is primarily for initial setup if only basic tiers are needed initially.
   * For full dual-tier initialization, use initializeAllComplianceRequirements.
   */
  static async initializeBasicComplianceRequirements(): Promise<void> {
    try {
      console.log('DEBUG: Initializing basic compliance requirements from templates');
      
      for (const [templateKey, template] of Object.entries(BASIC_COMPLIANCE_TEMPLATES)) {
        await this.initializeTemplateRequirements(template);
      }
      
      console.log('DEBUG: Successfully initialized basic compliance requirements');
    } catch (error) {
      console.error('Error initializing basic compliance requirements:', error);
      throw error;
    }
  }
  
  /**
   * Get compliance requirements template for a specific role and tier
   */
  static getRequirementsTemplateByTier(
    role: 'AP' | 'IC' | 'IP' | 'IT', 
    tier: 'basic' | 'robust'
  ): RoleComplianceTemplate | null {
    const templateKey = `${role}_${tier.toUpperCase()}`;
    
    if (tier === 'basic') {
      return BASIC_COMPLIANCE_TEMPLATES[templateKey] || null;
    } else {
      return ROBUST_COMPLIANCE_TEMPLATES[templateKey] || null;
    }
  }

  /**
   * Get all available templates for a role (both tiers)
   */
  static getAllTemplatesForRole(role: 'AP' | 'IC' | 'IP' | 'IT'): {
    basic: RoleComplianceTemplate | null;
    robust: RoleComplianceTemplate | null;
  } {
    return {
      basic: this.getRequirementsTemplateByTier(role, 'basic'),
      robust: this.getRequirementsTemplateByTier(role, 'robust')
    };
  }

  /**
   * Initialize both basic and robust compliance requirements from templates.
   * Creates compliance metrics and document requirements in the database for all defined tiers.
   */
  static async initializeAllComplianceRequirements(): Promise<void> {
    try {
      console.log('DEBUG: Initializing both basic and robust compliance requirements');
      
      // Initialize basic templates
      for (const [templateKey, template] of Object.entries(BASIC_COMPLIANCE_TEMPLATES)) {
        await this.initializeTemplateRequirements(template);
      }
      
      // Initialize robust templates
      for (const [templateKey, template] of Object.entries(ROBUST_COMPLIANCE_TEMPLATES)) {
        await this.initializeTemplateRequirements(template);
      }
      
      console.log('DEBUG: Successfully initialized all compliance requirements');
    } catch (error) {
      console.error('Error initializing all compliance requirements:', error);
      throw error;
    }
  }

  /**
   * Helper method to initialize requirements for a specific template
   */
  private static async initializeTemplateRequirements(template: RoleComplianceTemplate): Promise<void> {
    console.log(`DEBUG: Setting up requirements for ${template.role_name} (${template.tier || 'default'})`);
    
    await Promise.all(template.requirements.map(async (requirement) => {
      try {
        // Create compliance metric
        const metric = await ComplianceService.upsertComplianceMetric({
          name: `${requirement.name} (${template.tier || 'default'})`,
          description: requirement.description,
          category: requirement.category,
          required_for_roles: [template.role],
          measurement_type: requirement.measurement_type,
          target_value: requirement.target_value,
          weight: requirement.weight,
          is_active: true,
          applicable_tiers: template.tier || 'basic,robust'
        });
        
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
        }
        
        console.log(`DEBUG: Created ${requirement.name} for ${template.role_name}`);
      } catch (error) {
        console.error(`Error creating requirement ${requirement.name}:`, error);
        // Continue with other requirements
      }
    }));
  }

  /**
   * Get compliance requirements template for a specific role
   * @deprecated This method is deprecated with the introduction of tiers. Use getRequirementsTemplateByTier instead.
   */
  static getRequirementsTemplate(role: 'AP' | 'IC' | 'IP' | 'IT'): RoleComplianceTemplate | null {
    // Default to robust for existing usage if this method is still called from old code paths
    return this.getRequirementsTemplateByTier(role, 'robust'); 
  }
  
  /**
   * Get all available role templates (both basic and robust tiers for all roles)
   */
  static getAllRoleTemplates(): RoleComplianceTemplate[] {
    const allTemplates: RoleComplianceTemplate[] = [];
    Object.values(BASIC_COMPLIANCE_TEMPLATES).forEach(template => allTemplates.push(template));
    Object.values(ROBUST_COMPLIANCE_TEMPLATES).forEach(template => allTemplates.push(template));
    return allTemplates;
  }
  
  /**
   * Assign role-based compliance requirements to a user based on their assigned role and tier.
   * This method clears existing user compliance records and sets up new ones based on the selected tier.
   */
  static async assignRoleRequirementsToUser(userId: string, userRole: 'AP' | 'IC' | 'IP' | 'IT', userTier: 'basic' | 'robust'): Promise<UserRoleRequirements> {
    try {
      console.log(`DEBUG: Assigning role requirements to user ${userId} with role ${userRole} and tier ${userTier}`);
      
      const template = this.getRequirementsTemplateByTier(userRole, userTier);
      
      if (!template || template.requirements.length === 0) {
        console.log(`DEBUG: No requirements found for role ${userRole} and tier ${userTier}`);
        return {
          user_id: userId,
          role: userRole,
          assigned_requirements: [],
          setup_date: new Date().toISOString(),
          last_updated: new Date().toISOString()
        };
      }
      
      console.log(`DEBUG: Found ${template.requirements.length} requirements for role ${userRole} and tier ${userTier}`);
      
      // Clear existing records for the user to ensure only correct tier requirements are active
      await ComplianceService.deleteUserComplianceRecords(userId);
      
      const assignedMetrics: ComplianceMetric[] = [];
      for (const requirement of template.requirements) {
        try {
          const metric = await ComplianceService.upsertComplianceMetric({ // Ensure metric exists or create it
            name: `${requirement.name} (${template.tier || 'default'})`,
            description: requirement.description,
            category: requirement.category,
            required_for_roles: [template.role],
            measurement_type: requirement.measurement_type,
            target_value: requirement.target_value,
            weight: requirement.weight,
            is_active: true,
            applicable_tiers: template.tier || 'basic,robust'
          });

          await ComplianceService.updateComplianceRecord(
            userId,
            metric.id,
            null, // No initial value
            'pending', // Initial status
            `Initial setup for role ${userRole} and tier ${userTier}`
          );
          
          assignedMetrics.push(metric);
          console.log(`DEBUG: Created compliance record for ${requirement.name}`);
        } catch (error) {
          console.error(`Error creating compliance record for ${requirement.name}:`, error);
          // Continue with other requirements
        }
      }
      
      return {
        user_id: userId,
        role: userRole,
        assigned_requirements: assignedMetrics,
        setup_date: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error assigning role requirements to user:', error);
      throw error;
    }
  }
  
  /**
   * Update user role requirements when role or tier changes.
   * This method intelligently adds new requirements and marks old ones as 'not_applicable'.
   */
  static async updateUserRoleRequirements(
    userId: string, 
    oldRole: 'AP' | 'IC' | 'IP' | 'IT', 
    newRole: 'AP' | 'IC' | 'IP' | 'IT',
    oldTier: 'basic' | 'robust',
    newTier: 'basic' | 'robust'
  ): Promise<void> {
    try {
      console.log(`DEBUG: Updating user ${userId} role requirements from ${oldRole}:${oldTier} to ${newRole}:${newTier}`);
      
      // Get the new set of requirements for the user's new role and tier
      const newRequirementMetrics = await ComplianceService.getComplianceMetrics({ 
        role: newRole, 
        tier: newTier 
      });

      // Get current user compliance records (these have compliance_metrics nested)
      const currentRecords = await ComplianceService.getUserComplianceRecords(userId);
      const currentMetricIds = new Set(currentRecords.map(record => record.metric_id));

      // Determine which requirements to add (new metrics not in current records)
      const requirementsToAdd = newRequirementMetrics.filter(
        metric => !currentMetricIds.has(metric.id)
      );
      
      // Determine which requirements to potentially deactivate (current records whose metric IDs are not in the new set)
      const requirementsToPotentiallyDeactivate = currentRecords.filter(record => 
        !newRequirementMetrics.some(metric => metric.id === record.metric_id)
      );

      // Add new requirements
      for (const metric of requirementsToAdd) {
        await ComplianceService.updateComplianceRecord(
          userId,
          metric.id,
          null,
          'pending',
          `New requirement for role ${newRole} and tier ${newTier}`
        );
        console.log(`DEBUG: Added new requirement ${metric.name} for ${newRole}:${newTier}`);
      }

      // Deactivate old or no longer applicable requirements
      for (const record of requirementsToPotentiallyDeactivate) {
        // Ensure that record.compliance_metrics exists and has a category
        const metricCategory = record.compliance_metrics?.category || 'general'; 
        await ComplianceService.updateComplianceRecord(
          userId,
          record.metric_id,
          record.current_value,
          'not_applicable', // Correct status
          `Requirement no longer applicable due to role/tier change from ${oldRole}:${oldTier} to ${newRole}:${newTier}`
        );
        console.log(`DEBUG: Deactivated old requirement ${metricCategory} for ${oldRole}:${oldTier}`);
      }
      
      console.log(`DEBUG: Successfully updated role requirements for user ${userId}`);
    } catch (error) {
      console.error('Error updating user role requirements:', error);
      throw error;
    }
  }
  
  /**
   * Get role-specific compliance statistics, adjusted to also consider tiers.
   * Provides statistics broken down by role and by basic/robust tiers, plus an overall.
   */
  static async getRoleComplianceStatistics(): Promise<Array<{
    role: string;
    tier: 'basic' | 'robust' | 'overall';
    total_users: number;
    compliant_users: number;
    compliance_rate: number;
  }>> {
    try {
      const roles = ['AP', 'IC', 'IP', 'IT'];
      const statistics = [];
      
      for (const role of roles) {
        // Define a local interface for the expected Supabase profile data
        interface ProfileWithTier {
          id: string;
          compliance_tier: 'basic' | 'robust' | null;
        }

        const { data: usersInRole, error: usersError } = await supabase
          .from('profiles')
          .select('id, compliance_tier') // Explicitly select compliance_tier
          .eq('role', role);
        
        if (usersError) {
          console.error(`Error fetching users for role ${role}:`, usersError);
          continue;
        }
        
        let basicUsersCount = 0;
        let robustUsersCount = 0;
        let basicCompliantCount = 0;
        let robustCompliantCount = 0;
        
        // Cast usersInRole to the expected type for proper type checking
        for (const user of (usersInRole as ProfileWithTier[]) || []) {
          const tier = user.compliance_tier || 'basic'; // Default to basic if null
          const summary = await ComplianceService.getUserComplianceSummary(user.id);
          const isCompliant = summary.overall_score >= 90; // Define compliance based on your criteria
          
          if (tier === 'basic') {
            basicUsersCount++;
            if (isCompliant) basicCompliantCount++;
          } else {
            robustUsersCount++;
            if (isCompliant) robustCompliantCount++;
          }
        }
        
        statistics.push({
          role,
          tier: 'basic',
          total_users: basicUsersCount,
          compliant_users: basicCompliantCount,
          compliance_rate: basicUsersCount > 0 ? Math.round((basicCompliantCount / basicUsersCount) * 100) : 0
        });
        
        statistics.push({
          role,
          tier: 'robust',
          total_users: robustUsersCount,
          compliant_users: robustCompliantCount,
          compliance_rate: robustUsersCount > 0 ? Math.round((robustCompliantCount / robustUsersCount) * 100) : 0
        });

        // Add overall statistics for the role
        statistics.push({
          role,
          tier: 'overall',
          total_users: basicUsersCount + robustUsersCount,
          compliant_users: basicCompliantCount + robustCompliantCount,
          compliance_rate: (basicUsersCount + robustUsersCount) > 0 
            ? Math.round(((basicCompliantCount + robustCompliantCount) / (basicUsersCount + robustUsersCount)) * 100) 
            : 0
        });
      }
      
      return statistics;
    } catch (error) {
      console.error('Error getting role compliance statistics:', error);
      return [];
    }
  }
  
  /**
   * Create custom compliance requirement for an organization.
   * Automatically applies to 'basic,robust' tiers by default if not specified in the partial.
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
        is_active: true,
        // The tier for a Custom Requirement will typically override the template's tier
        // If a specific tier is not provided in the requirement, it applies to both by default.
        applicable_tiers: (requirement as any).tier || 'basic,robust' // Cast to any to allow 'tier' if it comes from `ComplianceRequirementTemplate`
      });
      
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
      }
      
      console.log(`DEBUG: Created custom requirement: ${metric.name}`);
      return metric;
    } catch (error) {
      console.error('Error creating custom requirement:', error);
      throw error;
    }
  }
}