# Compliance Management System - Day 1 Implementation Plan

## Overview

This document outlines the detailed implementation plan for Day 1 of the Compliance Management System implementation, focusing on deploying the dual-tier database schema and initializing the core services.

## Current State Analysis

The following components are already available:
- `20250624_dual_tier_compliance_system.sql` - Database schema for the dual-tier compliance system
- `complianceTierService.ts` - Service for managing compliance tiers (partially implemented)
- `complianceRequirementsService.ts` - Service for managing requirements (partially implemented)
- `initializeComplianceTiers.ts` - Script for initializing user tiers (only includes IT role)
- React hooks for tier data

## Day 1 Implementation Tasks

### 1. Deploy Dual-Tier Database Schema

The migration file `20250624_dual_tier_compliance_system.sql` is ready for deployment. It includes:
- Profile table updates for compliance_tier
- Compliance templates table
- Tier history tracking
- Requirements and records tables
- UI configuration support
- Proper indexes and RLS policies

**Steps:**
1. Connect to the Supabase project
2. Run the migration file using Supabase CLI:
   ```bash
   supabase db push --db-url=[DATABASE_URL]
   ```
   or via the Supabase dashboard SQL editor

3. Verify the tables were created properly:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name LIKE 'compliance_%';
   ```

### 2. Complete Requirement Templates for All Roles

The `initializeComplianceTiers.ts` script needs to be expanded to include templates for all roles (IT, IP, IC, AP) in both basic and robust tiers.

**Implementation:**

Update the `seedRequirementTemplates` function to include the following templates:

```typescript
// Existing IT templates (already implemented)
// ...

// IP Basic Requirements
{
  template_role: 'IP',
  template_tier: 'basic',
  requirements: [
    {
      name: 'Instructor Certification',
      description: 'Current instructor certification documentation',
      category: 'certification',
      requirement_type: 'certification',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf', '.jpg', '.png'],
        max_file_size: 5242880
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 15,
      display_order: 1
    },
    {
      name: 'Teaching Log',
      description: 'Log of teaching hours and classes taught',
      category: 'documentation',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['class_date', 'class_type', 'student_count', 'hours']
      },
      is_mandatory: true,
      points_value: 15,
      due_days_from_assignment: 30,
      display_order: 2
    },
    {
      name: 'Provisional Assessment',
      description: 'Complete provisional teaching assessment',
      category: 'assessment',
      requirement_type: 'assessment',
      ui_component_type: 'external_link',
      validation_rules: {
        min_score: 70
      },
      is_mandatory: true,
      points_value: 20,
      due_days_from_assignment: 60,
      display_order: 3
    }
  ]
},

// IP Robust Requirements
{
  template_role: 'IP',
  template_tier: 'robust',
  requirements: [
    {
      name: 'Advanced Teaching Certification',
      description: 'Advanced teaching methodology certification',
      category: 'certification',
      requirement_type: 'certification',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf'],
        max_file_size: 10485760
      },
      is_mandatory: true,
      points_value: 30,
      due_days_from_assignment: 45,
      display_order: 1
    },
    {
      name: 'Teaching Portfolio',
      description: 'Portfolio of teaching materials and student outcomes',
      category: 'portfolio',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['portfolio_url', 'student_outcomes', 'teaching_materials']
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 90,
      display_order: 2
    },
    {
      name: 'Mentor Observation',
      description: 'Teaching session observed by mentor',
      category: 'assessment',
      requirement_type: 'assessment',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['observation_date', 'mentor_name', 'feedback']
      },
      is_mandatory: true,
      points_value: 20,
      due_days_from_assignment: 60,
      display_order: 3
    },
    {
      name: 'Student Feedback Collection',
      description: 'Collect and analyze student feedback',
      category: 'documentation',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['student_count', 'average_rating', 'feedback_summary']
      },
      is_mandatory: true,
      points_value: 15,
      due_days_from_assignment: 75,
      display_order: 4
    },
    {
      name: 'Advanced Teaching Methods Course',
      description: 'Complete advanced teaching methodology course',
      category: 'training',
      requirement_type: 'training',
      ui_component_type: 'external_link',
      validation_rules: {
        min_score: 80
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 120,
      display_order: 5
    },
    {
      name: 'Professional Development Plan',
      description: 'Create a professional development plan',
      category: 'planning',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['goals', 'timeline', 'resources_needed']
      },
      is_mandatory: true,
      points_value: 10,
      due_days_from_assignment: 45,
      display_order: 6
    }
  ]
},

// IC Basic Requirements
{
  template_role: 'IC',
  template_tier: 'basic',
  requirements: [
    {
      name: 'Current Instructor Credentials',
      description: 'Maintain current instructor certification',
      category: 'certification',
      requirement_type: 'certification',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf', '.jpg', '.png'],
        max_file_size: 5242880
      },
      is_mandatory: true,
      points_value: 30,
      due_days_from_assignment: 30,
      display_order: 1
    },
    {
      name: 'Teaching Hours Log',
      description: 'Documentation of teaching hours',
      category: 'documentation',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['hours_taught', 'class_types', 'dates']
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 90,
      display_order: 2
    },
    {
      name: 'Student Outcomes Report',
      description: 'Report on student certification pass rates',
      category: 'performance',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['student_count', 'pass_rate', 'average_score']
      },
      is_mandatory: true,
      points_value: 20,
      due_days_from_assignment: 120,
      display_order: 3
    },
    {
      name: 'Continuing Education',
      description: 'Complete required continuing education',
      category: 'training',
      requirement_type: 'training',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf'],
        max_file_size: 5242880
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 180,
      display_order: 4
    }
  ]
},

// IC Robust Requirements
{
  template_role: 'IC',
  template_tier: 'robust',
  requirements: [
    {
      name: 'Master Instructor Certification',
      description: 'Advanced instructor certification',
      category: 'certification',
      requirement_type: 'certification',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf'],
        max_file_size: 10485760
      },
      is_mandatory: true,
      points_value: 40,
      due_days_from_assignment: 60,
      display_order: 1
    },
    // Add 7 more requirements for IC robust tier
    // ...
  ]
},

// AP Basic Requirements
{
  template_role: 'AP',
  template_tier: 'basic',
  requirements: [
    {
      name: 'Provider Certification',
      description: 'Current authorized provider certification',
      category: 'certification',
      requirement_type: 'certification',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf'],
        max_file_size: 10485760
      },
      is_mandatory: true,
      points_value: 30,
      due_days_from_assignment: 30,
      display_order: 1
    },
    // Add 2 more requirements for AP basic tier
    // ...
  ]
},

// AP Robust Requirements
{
  template_role: 'AP',
  template_tier: 'robust',
  requirements: [
    {
      name: 'Quality Management System',
      description: 'Documentation of quality management system',
      category: 'quality',
      requirement_type: 'document',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf', '.docx'],
        max_file_size: 15728640
      },
      is_mandatory: true,
      points_value: 35,
      due_days_from_assignment: 90,
      display_order: 1
    },
    // Add 6 more requirements for AP robust tier
    // ...
  ]
}
```

### 3. Implement getRequirementsTemplateByTier Method

The `complianceRequirementsService.ts` needs to have the `getRequirementsTemplateByTier` method implemented:

```typescript
export interface ComplianceTemplate {
  id: string;
  role: 'AP' | 'IC' | 'IP' | 'IT';
  tier: 'basic' | 'robust';
  template_name: string;
  description: string;
  requirements_count: number;
  total_weight: number;
  is_active: boolean;
  ui_config: any;
}

export class ComplianceRequirementsService {
  // Get template by role and tier
  static async getRequirementsTemplateByTier(
    role: 'AP' | 'IC' | 'IP' | 'IT',
    tier: 'basic' | 'robust'
  ): Promise<ComplianceTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('compliance_templates')
        .select('*')
        .eq('role', role)
        .eq('tier', tier)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching compliance template:', error);
      return null;
    }
  }
  
  // Implement initializeTierRequirements method
  static async initializeTierRequirements(
    userId: string,
    role: string,
    tier: string
  ): Promise<void> {
    try {
      // Get template ID for this role/tier
      const template = await this.getRequirementsTemplateByTier(
        role as 'AP' | 'IC' | 'IP' | 'IT',
        tier as 'basic' | 'robust'
      );
      
      if (!template) {
        throw new Error(`No template found for ${role}/${tier}`);
      }
      
      // Get requirements for this template
      const { data: requirements, error: reqError } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('template_id', template.id);
      
      if (reqError) throw reqError;
      
      if (!requirements || requirements.length === 0) {
        console.warn(`No requirements found for template ${template.id}`);
        return;
      }
      
      // Delete existing requirements for this user
      const { error: deleteError } = await supabase
        .from('user_compliance_records')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      
      // Create new compliance records
      const records = requirements.map(req => ({
        user_id: userId,
        requirement_id: req.id,
        status: 'pending',
        submission_data: {},
        ui_state: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from('user_compliance_records')
        .insert(records);
      
      if (insertError) throw insertError;
      
      console.log(`Initialized ${records.length} requirements for user ${userId}`);
    } catch (error) {
      console.error('Error initializing tier requirements:', error);
      throw error;
    }
  }
}
```

### 4. Create Deployment Script

Create a deployment script that will run all the necessary steps in sequence:

```typescript
// File: src/scripts/deployComplianceSystem.ts

import { supabase } from '@/lib/supabase';
import { initializeComplianceTiers, seedRequirementTemplates } from './initializeComplianceTiers';
import fs from 'fs';
import path from 'path';

async function deployDualTierSchema() {
  try {
    console.log('Deploying dual-tier compliance database schema...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../supabase/migrations/20250624_dual_tier_compliance_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL (this is simplified, in practice would use Supabase CLI)
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) throw error;
    
    console.log('Database schema deployed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deploying database schema:', error);
    return { success: false, error };
  }
}

async function deployComplianceSystem() {
  try {
    // Step 1: Deploy database schema
    const schemaResult = await deployDualTierSchema();
    if (!schemaResult.success) {
      throw new Error('Failed to deploy database schema');
    }
    
    // Step 2: Seed requirement templates
    const seedResult = await seedRequirementTemplates();
    if (!seedResult.success) {
      throw new Error('Failed to seed requirement templates');
    }
    
    // Step 3: Initialize user tiers and requirements
    const initResult = await initializeComplianceTiers();
    if (!initResult.success) {
      throw new Error('Failed to initialize compliance tiers');
    }
    
    console.log('Compliance system deployment complete!');
    console.log(`- Processed ${initResult.usersProcessed} users`);
    
    return {
      success: true,
      schemaDeployed: true,
      templatesSeedCount: Object.keys(seedResult).length,
      usersProcessed: initResult.usersProcessed
    };
  } catch (error) {
    console.error('Compliance system deployment failed:', error);
    return { success: false, error };
  }
}

// Run if called directly
if (require.main === module) {
  deployComplianceSystem()
    .then(result => {
      console.log('Deployment result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Deployment failed with error:', error);
      process.exit(1);
    });
}

export { deployComplianceSystem };
```

## Implementation Sequence

1. **Database Migration** - Deploy the SQL file to create all necessary tables
2. **Complete Requirements Templates** - Add templates for all roles and tiers
3. **Implement Service Methods** - Complete the tier-aware methods in the ComplianceRequirementsService
4. **Run the Deployment Script** - Execute the script to initialize the system

## Success Criteria for Day 1

- [ ] Database schema successfully deployed
- [ ] Templates created for all roles (IT, IP, IC, AP) and tiers (basic, robust)
- [ ] Requirements properly assigned to each template
- [ ] User profiles updated with default compliance tiers
- [ ] Requirements assigned to users based on their role and tier

## Verification Steps

After implementation, verify:
1. Check database tables for proper structure
2. Verify templates are created for all roles and tiers
3. Confirm user profiles have compliance_tier values
4. Check user_compliance_records for assigned requirements
5. Test the services to ensure they return correct data

## Next Steps for Day 2

After completing Day 1, the following will be ready for Day 2:
- Complete core services implementation
- Continue with dashboard integration
- Implement UI components