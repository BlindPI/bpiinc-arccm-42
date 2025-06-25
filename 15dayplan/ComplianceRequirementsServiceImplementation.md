# ComplianceRequirementsService Implementation Guide

## Overview

This document provides a detailed guide for implementing the remaining methods in the `ComplianceRequirementsService` class that are needed for Day 1 of the Compliance Management System implementation.

## Current State

The `complianceRequirementsService.ts` file already has several methods implemented:
- `getUIRequirements` - Fetches requirements formatted for UI display
- `submitRequirement` - Handles requirement submission with validation
- `handleUIAction` - Manages UI actions for requirements
- Various helper methods for formatting and validation

## Methods to Implement

### 1. getRequirementsTemplateByTier

This method retrieves a compliance template based on role and tier.

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
```

### 2. getRequirementsByTemplate

This method retrieves all requirements associated with a specific template.

```typescript
export interface ComplianceRequirement {
  id: string;
  template_id: string;
  name: string;
  description: string;
  category: string;
  requirement_type: string;
  ui_component_type: string;
  validation_rules: any;
  display_order: number;
  is_mandatory: boolean;
  points_value: number;
  due_days_from_assignment: number;
  help_text?: string;
}

static async getRequirementsByTemplate(templateId: string): Promise<ComplianceRequirement[]> {
  try {
    const { data, error } = await supabase
      .from('compliance_requirements')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return [];
  }
}
```

### 3. getRequirementsByRoleTier

This method directly fetches requirements based on role and tier, joining with the templates table.

```typescript
static async getRequirementsByRoleTier(
  role: string,
  tier: string
): Promise<ComplianceRequirement[]> {
  try {
    const { data, error } = await supabase
      .from('compliance_requirements')
      .select(`
        *,
        compliance_templates!inner(id, role, tier)
      `)
      .eq('compliance_templates.role', role)
      .eq('compliance_templates.tier', tier)
      .order('display_order', { ascending: true });

    if (error) throw error;
    
    // Extract requirements from the join result
    return (data || []).map(item => ({
      ...item,
      template_id: item.compliance_templates.id
    }));
  } catch (error) {
    console.error('Error fetching requirements by role/tier:', error);
    return [];
  }
}
```

### 4. initializeTierRequirements

This critical method assigns appropriate requirements to a user based on their role and tier.

```typescript
static async initializeTierRequirements(
  userId: string,
  role: string,
  tier: string
): Promise<{success: boolean; count: number}> {
  try {
    // Get requirements for this role/tier
    const requirements = await this.getRequirementsByRoleTier(role, tier);
    
    if (requirements.length === 0) {
      console.warn(`No requirements found for ${role}/${tier}`);
      return { success: true, count: 0 };
    }
    
    // Remove existing requirements (clean slate approach)
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
    
    // Log activity
    await this.logRequirementsActivity(userId, 'requirements_initialized', {
      role,
      tier,
      count: requirements.length
    });
    
    return { success: true, count: requirements.length };
  } catch (error) {
    console.error('Error initializing tier requirements:', error);
    return { success: false, count: 0 };
  }
}
```

### 5. logRequirementsActivity

This helper method logs requirement-related activities.

```typescript
private static async logRequirementsActivity(
  userId: string,
  action: string,
  metadata: any
): Promise<void> {
  try {
    await supabase
      .from('compliance_activity_log')
      .insert({
        user_id: userId,
        action,
        metadata,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.warn('Failed to log compliance activity:', error);
    // Non-critical error, don't throw
  }
}
```

## Integration with initializeComplianceTiers.ts

The `initializeComplianceTiers.ts` script needs to be updated to use these new methods. The key change is in the `assignTierRequirements` call:

```typescript
// In initializeComplianceTiers.ts

// 3. Assign appropriate requirements
const requirementResult = await ComplianceRequirementsService.initializeTierRequirements(
  user.id,
  user.role,
  user.compliance_tier || 'basic'
);

if (requirementResult.success) {
  console.log(`Assigned ${requirementResult.count} requirements for ${user.display_name}`);
} else {
  console.error(`Failed to assign requirements for user ${user.id}`);
}
```

## Testing Implementation

After implementing these methods, verify their functionality:

1. Test `getRequirementsTemplateByTier`:
```typescript
const template = await ComplianceRequirementsService.getRequirementsTemplateByTier('IT', 'basic');
console.log('Template:', template);
```

2. Test `getRequirementsByRoleTier`:
```typescript
const requirements = await ComplianceRequirementsService.getRequirementsByRoleTier('IT', 'basic');
console.log(`Found ${requirements.length} requirements`);
```

3. Test `initializeTierRequirements`:
```typescript
const result = await ComplianceRequirementsService.initializeTierRequirements('test-user-id', 'IT', 'basic');
console.log(`Initialized ${result.count} requirements`);
```

## Error Handling

All methods include proper error handling with:
- Try/catch blocks
- Error logging
- Appropriate return values for failures
- No exception propagation in non-critical methods

## Performance Considerations

- The `getRequirementsByRoleTier` method uses a join query to minimize database calls
- The `initializeTierRequirements` method performs a clean slate approach, which is appropriate for the initialization phase
- Activity logging is implemented as a non-blocking operation