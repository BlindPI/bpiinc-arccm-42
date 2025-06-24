// File: src/services/compliance/complianceRequirementsService.ts

import { supabase } from '@/lib/supabase';

export interface UIRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'document' | 'training' | 'certification' | 'assessment';
  ui_component: 'file_upload' | 'form' | 'external_link' | 'checkbox';
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  progress: number;
  validation_rules: {
    file_types?: string[];
    max_file_size?: number;
    required_fields?: string[];
    min_score?: number;
    max_files?: number;
  };
  submission_data?: any;
  ui_state?: {
    expanded: boolean;
    form_data: Record<string, any>;
    upload_progress: number;
    validation_errors: string[];
  };
  actions: {
    can_submit: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_view_details: boolean;
  };
  display_config: {
    icon: string;
    color: string;
    priority: 'high' | 'medium' | 'low';
    show_progress_bar: boolean;
  };
  due_date?: string;
  submitted_at?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface SubmissionData {
  requirementId?: string;
  files?: Array<{
    id: string;
    name: string;
    size: number;
    url: string;
    uploadedAt: string;
  }>;
  text?: string;
  score?: number;
  notes?: string;
  submittedAt?: string;
  [key: string]: any;
}

export interface SubmissionResult {
  success: boolean;
  record?: any;
  errors?: string[];
  autoApproved?: boolean;
}

export class ComplianceRequirementsService {
  // Get requirements formatted for UI display (From Currentplan2.md)
  static async getUIRequirements(
    userId: string,
    role: string,
    tier: string
  ): Promise<UIRequirement[]> {
    try {
      // Fetch requirements with user's progress
      const { data: requirements, error } = await supabase
        .from('compliance_requirements')
        .select(`
          *,
          compliance_templates!inner(role, tier),
          user_compliance_records!left(
            id,
            status,
            submission_data,
            ui_state,
            submitted_at,
            reviewed_at,
            review_notes
          )
        `)
        .eq('compliance_templates.role', role)
        .eq('compliance_templates.tier', tier)
        .eq('user_compliance_records.user_id', userId)
        .order('display_order');
      
      if (error) throw error;
      
      return requirements?.map(req => this.formatForUI(req, userId)) || [];
    } catch (error) {
      console.error('Error fetching UI requirements:', error);
      throw error;
    }
  }
  
  // Submit requirement with validation (From Currentplan2.md)
  static async submitRequirement(
    userId: string,
    requirementId: string,
    submissionData: SubmissionData
  ): Promise<SubmissionResult> {
    try {
      // Get requirement details
      const { data: requirement, error: reqError } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('id', requirementId)
        .single();
      
      if (reqError) throw reqError;
      if (!requirement) throw new Error('Requirement not found');
      
      // Validate submission
      const validationResult = this.validateSubmission(requirement, submissionData);
      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }
      
      // Update or create user compliance record
      const { data: record, error: recordError } = await supabase
        .from('user_compliance_records')
        .upsert({
          user_id: userId,
          requirement_id: requirementId,
          status: 'submitted',
          submission_data: submissionData,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (recordError) throw recordError;
      
      // Check for auto-approval
      let finalStatus = 'submitted';
      let autoApproved = false;
      
      if (requirement.auto_approval_rules?.enabled) {
        const autoApprovalResult = await this.processAutoApproval(
          requirement,
          submissionData
        );
        
        if (autoApprovalResult.approved) {
          finalStatus = 'approved';
          autoApproved = true;
          
          // Update record with approval
          await supabase
            .from('user_compliance_records')
            .update({
              status: 'approved',
              reviewed_at: new Date().toISOString(),
              review_notes: 'Automatically approved'
            })
            .eq('id', record.id);
        }
      }
      
      // Log activity
      await this.logActivity(userId, {
        action: 'requirement_submitted',
        requirementId,
        requirementName: requirement.name,
        oldStatus: 'in_progress',
        newStatus: finalStatus
      });
      
      return {
        success: true,
        record: {
          ...record,
          status: finalStatus
        },
        autoApproved
      };
    } catch (error) {
      console.error('Error submitting requirement:', error);
      throw error;
    }
  }
  
  // Handle UI actions (From Currentplan2.md)
  static async handleUIAction(
    userId: string,
    requirementId: string,
    action: 'start' | 'submit' | 'save_draft' | 'request_help',
    data?: any
  ): Promise<{ success: boolean; updatedRequirement: UIRequirement }> {
    try {
      switch (action) {
        case 'start':
          await this.updateRequirementStatus(userId, requirementId, 'in_progress');
          break;
          
        case 'submit':
          await this.submitRequirement(userId, requirementId, data);
          break;
          
        case 'save_draft':
          await this.saveDraft(userId, requirementId, data);
          break;
          
        case 'request_help':
          await this.createHelpRequest(userId, requirementId);
          break;
      }
      
      const updated = await this.getUIRequirement(userId, requirementId);
      return { success: true, updatedRequirement: updated };
    } catch (error) {
      console.error('Error handling UI action:', error);
      throw error;
    }
  }
  
  // Update requirement status
  static async updateRequirementStatus(
    userId: string,
    requirementId: string,
    status: string,
    additionalData?: any
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (additionalData) {
        Object.assign(updateData, additionalData);
      }
      
      const { error } = await supabase
        .from('user_compliance_records')
        .update(updateData)
        .eq('user_id', userId)
        .eq('requirement_id', requirementId);
      
      if (error) throw error;
      
      // Log activity
      await this.logActivity(userId, {
        action: 'status_updated',
        requirementId,
        newStatus: status
      });
    } catch (error) {
      console.error('Error updating requirement status:', error);
      throw error;
    }
  }
  
  // Format requirement for UI (From Currentplan2.md)
  private static formatForUI(req: any, userId: string): UIRequirement {
    const record = req.user_compliance_records?.[0];
    const status = record?.status || 'pending';
    
    return {
      id: req.id,
      name: req.name,
      description: req.description,
      category: req.category,
      type: req.requirement_type,
      ui_component: req.ui_component_type,
      status,
      progress: this.calculateProgress(status),
      validation_rules: req.validation_rules || {},
      submission_data: record?.submission_data,
      ui_state: record?.ui_state || {
        expanded: false,
        form_data: {},
        upload_progress: 0,
        validation_errors: []
      },
      actions: {
        can_submit: status === 'in_progress' || status === 'pending',
        can_edit: status !== 'approved',
        can_delete: status === 'pending',
        can_view_details: true
      },
      display_config: {
        icon: this.getStatusIcon(status),
        color: this.getStatusColor(status),
        priority: req.is_mandatory ? 'high' : 'medium',
        show_progress_bar: req.ui_component_type === 'form'
      },
      due_date: this.calculateDueDate(record?.created_at, req.due_days_from_assignment),
      submitted_at: record?.submitted_at,
      reviewed_at: record?.reviewed_at,
      review_notes: record?.review_notes
    };
  }
  
  // Validation helper
  private static validateSubmission(requirement: any, submissionData: SubmissionData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const rules = requirement.validation_rules || {};
    
    // Check required fields
    if (rules.required_fields) {
      rules.required_fields.forEach((field: string) => {
        if (!submissionData[field]) {
          errors.push(`Field '${field}' is required`);
        }
      });
    }
    
    // Check file requirements
    if (requirement.ui_component_type === 'file_upload') {
      if (!submissionData.files || submissionData.files.length === 0) {
        errors.push('At least one file must be uploaded');
      }
    }
    
    // Check score requirements
    if (requirement.requirement_type === 'assessment' && rules.min_score) {
      const score = parseFloat(submissionData.score);
      if (isNaN(score) || score < rules.min_score) {
        errors.push(`Minimum score of ${rules.min_score} required`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Helper methods
  private static calculateProgress(status: string): number {
    switch (status) {
      case 'approved': return 100;
      case 'submitted': return 80;
      case 'in_progress': return 50;
      case 'rejected': return 25;
      default: return 0;
    }
  }
  
  private static getStatusIcon(status: string): string {
    const icons = {
      approved: 'CheckCircle',
      submitted: 'Clock',
      in_progress: 'PlayCircle',
      rejected: 'XCircle',
      pending: 'Circle'
    };
    return icons[status as keyof typeof icons] || 'Circle';
  }
  
  private static getStatusColor(status: string): string {
    const colors = {
      approved: 'green',
      submitted: 'blue',
      in_progress: 'yellow',
      rejected: 'red',
      pending: 'gray'
    };
    return colors[status as keyof typeof colors] || 'gray';
  }
  
  private static calculateDueDate(createdAt?: string, dueDays?: number): string | undefined {
    if (!createdAt || !dueDays) return undefined;
    
    const created = new Date(createdAt);
    const due = new Date(created.getTime() + (dueDays * 24 * 60 * 60 * 1000));
    return due.toISOString();
  }
  
  // Additional helper methods
  private static async getUIRequirement(userId: string, requirementId: string): Promise<UIRequirement> {
    const { data: req, error } = await supabase
      .from('compliance_requirements')
      .select(`
        *,
        user_compliance_records!left(
          id, status, submission_data, ui_state, submitted_at, reviewed_at, review_notes
        )
      `)
      .eq('id', requirementId)
      .eq('user_compliance_records.user_id', userId)
      .single();
    
    if (error) throw error;
    return this.formatForUI(req, userId);
  }
  
  private static async saveDraft(userId: string, requirementId: string, data: any): Promise<void> {
    await supabase
      .from('user_compliance_records')
      .upsert({
        user_id: userId,
        requirement_id: requirementId,
        ui_state: data.ui_state || {},
        submission_data: data.submission_data || {},
        updated_at: new Date().toISOString()
      });
  }
  
  private static async createHelpRequest(userId: string, requirementId: string): Promise<void> {
    // Implementation for help request system
    await this.logActivity(userId, {
      action: 'help_requested',
      requirementId,
      metadata: { timestamp: new Date().toISOString() }
    });
  }
  
  private static async processAutoApproval(requirement: any, submissionData: SubmissionData): Promise<{ approved: boolean; reason?: string }> {
    const rules = requirement.auto_approval_rules;
    
    if (!rules || !rules.enabled) {
      return { approved: false };
    }
    
    if (rules.always_approve) {
      return { approved: true, reason: 'Auto-approval rule: always approve' };
    }
    
    // Additional auto-approval logic would go here
    
    return { approved: false };
  }
  
  private static async logActivity(userId: string, activity: any): Promise<void> {
    try {
      await supabase
        .from('compliance_activity_log')
        .insert({
          user_id: userId,
          action: activity.action,
          requirement_id: activity.requirementId || null,
          metadata: activity,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }
}