# Complete Requirement Templates

This document outlines the complete requirement templates for all roles (IT, IP, IC, AP) that need to be implemented in the `initializeComplianceTiers.ts` script.

## Overview

The `initializeComplianceTiers.ts` script currently only includes templates for the IT role. This document provides detailed templates for all roles in both basic and robust tiers to complete the implementation.

## Template Structure

Each template follows this structure:
```typescript
{
  template_role: 'ROLE', // 'IT', 'IP', 'IC', or 'AP'
  template_tier: 'TIER', // 'basic' or 'robust'
  requirements: [
    {
      name: 'Requirement Name',
      description: 'Detailed description',
      category: 'certification|training|documentation|assessment|etc',
      requirement_type: 'certification|training|document|assessment',
      ui_component_type: 'file_upload|form|external_link|checkbox',
      validation_rules: {
        // Specific validation rules
      },
      is_mandatory: true|false,
      points_value: 10-40,
      due_days_from_assignment: 15-180,
      display_order: 1-N
    },
    // Additional requirements...
  ]
}
```

## Instructor Trainee (IT) Templates

### IT Basic Requirements (Already implemented)
```typescript
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
    // Other requirements as already implemented
  ]
}
```

### IT Robust Requirements (Already implemented)
```typescript
{
  template_role: 'IT',
  template_tier: 'robust',
  requirements: [
    // As already implemented
  ]
}
```

## Instructor Provisional (IP) Templates

### IP Basic Requirements
```typescript
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
}
```

### IP Robust Requirements
```typescript
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
}
```

## Instructor Certified (IC) Templates

### IC Basic Requirements
```typescript
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
}
```

### IC Robust Requirements
```typescript
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
    {
      name: 'Specialized Teaching Credential',
      description: 'Specialized teaching credential in advanced areas',
      category: 'certification',
      requirement_type: 'certification',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf', '.jpg', '.png'],
        max_file_size: 10485760
      },
      is_mandatory: true,
      points_value: 35,
      due_days_from_assignment: 90,
      display_order: 2
    },
    {
      name: 'Instructor Development Course',
      description: 'Advanced course for developing other instructors',
      category: 'training',
      requirement_type: 'training',
      ui_component_type: 'external_link',
      validation_rules: {
        min_score: 85
      },
      is_mandatory: true,
      points_value: 30,
      due_days_from_assignment: 120,
      display_order: 3
    },
    {
      name: 'Course Development Portfolio',
      description: 'Portfolio of course materials developed',
      category: 'portfolio',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['course_names', 'materials_link', 'development_process']
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 180,
      display_order: 4
    },
    {
      name: 'Mentorship Documentation',
      description: 'Documentation of mentoring junior instructors',
      category: 'mentorship',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['mentee_names', 'mentorship_hours', 'development_areas']
      },
      is_mandatory: true,
      points_value: 20,
      due_days_from_assignment: 90,
      display_order: 5
    },
    {
      name: 'Advanced Assessment Methods',
      description: 'Training in advanced student assessment methods',
      category: 'training',
      requirement_type: 'training',
      ui_component_type: 'external_link',
      validation_rules: {
        min_score: 80
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 150,
      display_order: 6
    },
    {
      name: 'Quality Improvement Project',
      description: 'Implementation of teaching quality improvement project',
      category: 'project',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['project_title', 'implementation_details', 'outcomes']
      },
      is_mandatory: true,
      points_value: 30,
      due_days_from_assignment: 240,
      display_order: 7
    },
    {
      name: 'Research Contribution',
      description: 'Contribution to teaching methodology research',
      category: 'research',
      requirement_type: 'document',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf', '.docx'],
        max_file_size: 15728640
      },
      is_mandatory: false,
      points_value: 25,
      due_days_from_assignment: 365,
      display_order: 8
    }
  ]
}
```

## Authorized Provider (AP) Templates

### AP Basic Requirements
```typescript
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
    {
      name: 'Facility Documentation',
      description: 'Documentation of facility requirements compliance',
      category: 'documentation',
      requirement_type: 'document',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf', '.jpg', '.png'],
        max_file_size: 10485760
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 45,
      display_order: 2
    },
    {
      name: 'Instructor Roster',
      description: 'Current roster of certified instructors',
      category: 'documentation',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['instructor_names', 'certification_numbers', 'expiry_dates']
      },
      is_mandatory: true,
      points_value: 20,
      due_days_from_assignment: 60,
      display_order: 3
    }
  ]
}
```

### AP Robust Requirements
```typescript
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
    {
      name: 'Advanced Provider Certification',
      description: 'Comprehensive provider certification',
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
      display_order: 2
    },
    {
      name: 'Instructor Development Program',
      description: 'Documentation of instructor development program',
      category: 'training',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['program_details', 'implementation_plan', 'success_metrics']
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 120,
      display_order: 3
    },
    {
      name: 'Student Outcomes Analysis',
      description: 'Comprehensive analysis of student outcomes',
      category: 'performance',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['success_rate', 'analysis_period', 'improvement_actions']
      },
      is_mandatory: true,
      points_value: 25,
      due_days_from_assignment: 180,
      display_order: 4
    },
    {
      name: 'Facility Excellence Certification',
      description: 'Advanced facility standards certification',
      category: 'certification',
      requirement_type: 'certification',
      ui_component_type: 'file_upload',
      validation_rules: {
        file_types: ['.pdf', '.jpg', '.png'],
        max_file_size: 10485760
      },
      is_mandatory: true,
      points_value: 20,
      due_days_from_assignment: 90,
      display_order: 5
    },
    {
      name: 'Community Outreach Program',
      description: 'Documentation of community engagement initiatives',
      category: 'outreach',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['program_name', 'activities', 'impact_metrics']
      },
      is_mandatory: false,
      points_value: 15,
      due_days_from_assignment: 240,
      display_order: 6
    },
    {
      name: 'Advanced Reporting System',
      description: 'Implementation of comprehensive reporting system',
      category: 'administration',
      requirement_type: 'document',
      ui_component_type: 'form',
      validation_rules: {
        required_fields: ['system_details', 'report_examples', 'data_security']
      },
      is_mandatory: true,
      points_value: 20,
      due_days_from_assignment: 150,
      display_order: 7
    }
  ]
}
```

## Implementation Notes

1. Add these templates to the `seedRequirementTemplates` function in `initializeComplianceTiers.ts`
2. Make sure to properly error-handle template insertion
3. Update the requirements_count in the compliance_templates table to match the actual number of requirements in each template
4. Ensure each template has a unique role/tier combination

## Template Validation Checklist

- [ ] All templates have unique role/tier combinations
- [ ] Each requirement has all required fields (name, description, category, etc.)
- [ ] Validation rules are appropriate for the ui_component_type
- [ ] Display order is sequential and without gaps
- [ ] Point values are reasonable and consistent
- [ ] Due dates are appropriate for the complexity of the requirement