// File: src/scripts/initializeComplianceTiers.ts

import { supabase } from '@/lib/supabase';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';

export async function initializeComplianceTiers() {
  try {
    console.log('Initializing compliance tier system...');
    
    // 1. Get all users with instructor roles
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, role, compliance_tier, display_name')
      .in('role', ['IT', 'IP', 'IC', 'AP']);
    
    if (usersError) throw usersError;
    
    console.log(`Found ${users?.length || 0} users to initialize`);
    
    // 2. Initialize tier data for each user
    for (const user of users || []) {
      if (!user.compliance_tier) {
        // Set default tier based on role
        const defaultTier = user.role === 'IT' ? 'basic' : 'robust';
        
        const result = await ComplianceTierService.switchUserTier(
          user.id,
          defaultTier,
          user.id,
          'System initialization'
        );
        
        if (result.success) {
          console.log(`Initialized ${user.display_name} (${user.role}) with ${defaultTier} tier`);
        } else {
          console.error(`Failed to initialize user ${user.id}:`, result.message);
        }
      } else {
        // Ensure requirements are assigned for existing tier
        await ComplianceTierService.assignTierRequirements(
          user.id,
          user.role,
          user.compliance_tier
        );
        console.log(`Verified requirements for ${user.display_name} (${user.role}, ${user.compliance_tier})`);
      }
    }
    
    console.log('Compliance tier initialization complete');
    return { success: true, usersProcessed: users?.length || 0 };
  } catch (error) {
    console.error('Error initializing compliance tiers:', error);
    throw error;
  }
}

// Seed requirement templates (From Currentplan2.md)
export async function seedRequirementTemplates() {
  try {
    console.log('Seeding requirement templates...');
    
    const requirementTemplates = [
      // IT Basic Requirements
      {
        template_role: 'IT',
        template_tier: 'basic',
        requirements: [
          {
            name: 'CPR/AED Certification',
            description: 'Current CPR and AED certification from approved provider',
            category: 'certification',
            requirement_type: 'certification',
            ui_component_type: 'file_upload',
            validation_rules: {
              file_types: ['.pdf', '.jpg', '.png'],
              max_file_size: 5242880,
              required_fields: ['expiry_date']
            },
            is_mandatory: true,
            points_value: 20,
            due_days_from_assignment: 30,
            display_order: 1
          },
          {
            name: 'Water Safety Training',
            description: 'Complete water safety fundamentals course',
            category: 'training',
            requirement_type: 'training',
            ui_component_type: 'external_link',
            validation_rules: {
              min_score: 80,
              required_fields: ['completion_date', 'score']
            },
            is_mandatory: true,
            points_value: 15,
            due_days_from_assignment: 45,
            display_order: 2
          },
          {
            name: 'Background Check',
            description: 'Submit criminal background check documentation',
            category: 'documentation',
            requirement_type: 'document',
            ui_component_type: 'file_upload',
            validation_rules: {
              file_types: ['.pdf'],
              max_file_size: 10485760
            },
            is_mandatory: true,
            points_value: 10,
            due_days_from_assignment: 15,
            display_order: 3
          }
        ]
      },
      // IT Robust Requirements
      {
        template_role: 'IT',
        template_tier: 'robust',
        requirements: [
          {
            name: 'Advanced Lifeguard Training',
            description: 'Complete advanced lifeguarding techniques course',
            category: 'training',
            requirement_type: 'training',
            ui_component_type: 'form',
            validation_rules: {
              min_score: 85,
              required_fields: ['completion_date', 'score', 'instructor_name']
            },
            is_mandatory: true,
            points_value: 25,
            due_days_from_assignment: 60,
            display_order: 1
          },
          {
            name: 'Teaching Methodology',
            description: 'Complete instructional design and teaching methods course',
            category: 'pedagogy',
            requirement_type: 'training',
            ui_component_type: 'form',
            validation_rules: {
              min_score: 80,
              required_fields: ['completion_date', 'final_project']
            },
            is_mandatory: true,
            points_value: 20,
            due_days_from_assignment: 90,
            display_order: 2
          },
          {
            name: 'Practical Teaching Assessment',
            description: 'Complete supervised teaching practicum',
            category: 'assessment',
            requirement_type: 'assessment',
            ui_component_type: 'form',
            validation_rules: {
              min_score: 75,
              required_fields: ['assessment_date', 'evaluator', 'score']
            },
            is_mandatory: true,
            points_value: 30,
            due_days_from_assignment: 120,
            display_order: 3
          }
        ]
      }
      // Add more templates for IP, IC, AP roles...
    ];
    
    for (const template of requirementTemplates) {
      // Get template ID
      const { data: templateData, error: templateError } = await supabase
        .from('compliance_templates')
        .select('id')
        .eq('role', template.template_role)
        .eq('tier', template.template_tier)
        .single();
      
      if (templateError) {
        console.error(`Template not found for ${template.template_role}/${template.template_tier}`);
        continue;
      }
      
      // Insert requirements
      for (const requirement of template.requirements) {
        const { error: reqError } = await supabase
          .from('compliance_requirements')
          .upsert({
            template_id: templateData.id,
            ...requirement
          });
        
        if (reqError) {
          console.error('Error inserting requirement:', reqError);
        } else {
          console.log(`Seeded requirement: ${requirement.name}`);
        }
      }
    }
    
    console.log('Requirement templates seeded successfully');
    return { success: true };
  } catch (error) {
    console.error('Error seeding requirement templates:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  Promise.all([
    initializeComplianceTiers(),
    seedRequirementTemplates()
  ])
    .then((results) => {
      console.log('Initialization results:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}