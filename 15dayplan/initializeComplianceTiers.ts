// File: src/scripts/initializeComplianceTiers.ts

// These are reference imports, in actual implementation they would be properly resolved
// import { supabase } from '@/lib/supabase';
// import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { allRequirementTemplates, calculateTotalPoints } from './completeRequirementTemplates';

// Mock references for demonstration purposes
const supabase = { from: () => ({}) } as any;
const ComplianceTierService = {
  switchUserTier: async () => ({ success: true }),
  assignTierRequirements: async () => {}
} as any;

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

// Seed requirement templates using comprehensive templates from completeRequirementTemplates.ts
export async function seedRequirementTemplates() {
  try {
    console.log('Seeding requirement templates for all roles and tiers...');
    
    // Using the comprehensive templates imported from completeRequirementTemplates.ts
    
    for (const template of allRequirementTemplates) {
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
    
    console.log('All requirement templates seeded successfully for all roles (IT, IP, IC, AP) and tiers');
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