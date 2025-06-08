
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam } from '@/types/team-management';

export interface ProviderWorkflow {
  id: string;
  provider_id: string;
  workflow_type: 'onboarding' | 'team_creation' | 'performance_review' | 'compliance_check';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  steps: WorkflowStep[];
  current_step: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  step_number: number;
  step_name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignee_id?: string;
  due_date?: string;
  requirements: string[];
  metadata: Record<string, any>;
}

export interface ProviderOnboardingData {
  provider_name: string;
  contact_email: string;
  primary_location_id: string;
  certification_levels: string[];
  specializations: string[];
}

export class ProviderWorkflowService {
  async createOnboardingWorkflow(
    providerId: string,
    onboardingData: ProviderOnboardingData
  ): Promise<ProviderWorkflow> {
    try {
      const workflow = {
        provider_id: providerId,
        workflow_type: 'onboarding' as const,
        status: 'pending' as const,
        current_step: 0,
        metadata: {
          provider_data: onboardingData,
          created_by: 'system'
        }
      };

      const { data, error } = await supabase
        .from('provider_workflows')
        .insert(workflow)
        .select()
        .single();

      if (error) throw error;

      // Create workflow steps
      const steps = this.createOnboardingSteps(data.id);
      await this.createWorkflowSteps(data.id, steps);

      return {
        ...data,
        steps
      };
    } catch (error) {
      console.error('Error creating onboarding workflow:', error);
      throw error;
    }
  }

  async createTeamCreationWorkflow(
    providerId: string,
    teamData: {
      team_name: string;
      location_id: string;
      initial_members: string[];
    }
  ): Promise<ProviderWorkflow> {
    try {
      const workflow = {
        provider_id: providerId,
        workflow_type: 'team_creation' as const,
        status: 'pending' as const,
        current_step: 0,
        metadata: {
          team_data: teamData
        }
      };

      const { data, error } = await supabase
        .from('provider_workflows')
        .insert(workflow)
        .select()
        .single();

      if (error) throw error;

      const steps = this.createTeamCreationSteps(data.id, teamData);
      await this.createWorkflowSteps(data.id, steps);

      return {
        ...data,
        steps
      };
    } catch (error) {
      console.error('Error creating team creation workflow:', error);
      throw error;
    }
  }

  async getProviderWorkflows(providerId: string): Promise<ProviderWorkflow[]> {
    try {
      const { data: workflows, error } = await supabase
        .from('provider_workflows')
        .select(`
          *,
          workflow_steps (*)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (workflows || []).map(workflow => ({
        ...workflow,
        steps: workflow.workflow_steps || []
      }));
    } catch (error) {
      console.error('Error getting provider workflows:', error);
      return [];
    }
  }

  async approveWorkflowStep(
    workflowId: string,
    stepId: string,
    approverId: string,
    notes?: string
  ): Promise<void> {
    try {
      // Update step status
      await supabase
        .from('workflow_steps')
        .update({
          status: 'completed',
          metadata: {
            approved_by: approverId,
            approved_at: new Date().toISOString(),
            notes
          }
        })
        .eq('id', stepId);

      // Check if this advances the workflow
      await this.checkWorkflowProgress(workflowId);
    } catch (error) {
      console.error('Error approving workflow step:', error);
      throw error;
    }
  }

  async executeAutomatedStep(workflowId: string, stepId: string): Promise<void> {
    try {
      const { data: step } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (!step) throw new Error('Step not found');

      // Execute automated actions based on step type
      switch (step.step_name) {
        case 'create_provider_team':
          await this.executeCreateProviderTeam(workflowId);
          break;
        case 'setup_permissions':
          await this.executeSetupPermissions(workflowId);
          break;
        case 'send_welcome_email':
          await this.executeSendWelcomeEmail(workflowId);
          break;
        default:
          console.log('No automation for step:', step.step_name);
      }

      // Mark step as completed
      await supabase
        .from('workflow_steps')
        .update({
          status: 'completed',
          metadata: {
            automated: true,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', stepId);

      await this.checkWorkflowProgress(workflowId);
    } catch (error) {
      console.error('Error executing automated step:', error);
      throw error;
    }
  }

  private async createWorkflowSteps(workflowId: string, steps: Omit<WorkflowStep, 'id'>[]): Promise<void> {
    const stepsWithWorkflowId = steps.map(step => ({
      ...step,
      workflow_id: workflowId
    }));

    await supabase
      .from('workflow_steps')
      .insert(stepsWithWorkflowId);
  }

  private createOnboardingSteps(workflowId: string): Omit<WorkflowStep, 'id'>[] {
    return [
      {
        step_number: 1,
        step_name: 'document_verification',
        description: 'Verify provider documentation and credentials',
        status: 'pending',
        requirements: ['Business license', 'Insurance certificate', 'Certification documents'],
        metadata: { manual_review: true }
      },
      {
        step_number: 2,
        step_name: 'background_check',
        description: 'Conduct background verification',
        status: 'pending',
        requirements: ['Criminal background check', 'Reference verification'],
        metadata: { manual_review: true }
      },
      {
        step_number: 3,
        step_name: 'setup_permissions',
        description: 'Configure provider permissions and access',
        status: 'pending',
        requirements: ['Location access', 'System permissions'],
        metadata: { automated: true }
      },
      {
        step_number: 4,
        step_name: 'create_provider_team',
        description: 'Create initial provider team',
        status: 'pending',
        requirements: ['Team structure defined', 'Initial members identified'],
        metadata: { automated: true }
      },
      {
        step_number: 5,
        step_name: 'send_welcome_email',
        description: 'Send welcome package to provider',
        status: 'pending',
        requirements: ['Onboarding completed', 'Access credentials ready'],
        metadata: { automated: true }
      }
    ];
  }

  private createTeamCreationSteps(workflowId: string, teamData: any): Omit<WorkflowStep, 'id'>[] {
    return [
      {
        step_number: 1,
        step_name: 'validate_team_request',
        description: 'Validate team creation request and requirements',
        status: 'pending',
        requirements: ['Valid location', 'Provider capacity check'],
        metadata: { automated: true }
      },
      {
        step_number: 2,
        step_name: 'create_team_structure',
        description: 'Create team in system',
        status: 'pending',
        requirements: ['Team name available', 'Location assignment confirmed'],
        metadata: { automated: true }
      },
      {
        step_number: 3,
        step_name: 'assign_team_members',
        description: 'Assign initial team members',
        status: 'pending',
        requirements: ['Members verified', 'Roles defined'],
        metadata: { automated: true }
      },
      {
        step_number: 4,
        step_name: 'setup_team_permissions',
        description: 'Configure team permissions and access',
        status: 'pending',
        requirements: ['Access levels defined', 'Security clearance'],
        metadata: { automated: true }
      }
    ];
  }

  private async checkWorkflowProgress(workflowId: string): Promise<void> {
    const { data: workflow } = await supabase
      .from('provider_workflows')
      .select(`
        *,
        workflow_steps (*)
      `)
      .eq('id', workflowId)
      .single();

    if (!workflow) return;

    const completedSteps = workflow.workflow_steps.filter((step: any) => step.status === 'completed').length;
    const totalSteps = workflow.workflow_steps.length;

    if (completedSteps === totalSteps) {
      // Workflow completed
      await supabase
        .from('provider_workflows')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);
    } else {
      // Update current step
      const nextStep = workflow.workflow_steps.find((step: any) => step.status === 'pending');
      if (nextStep) {
        await supabase
          .from('provider_workflows')
          .update({
            current_step: nextStep.step_number - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', workflowId);
      }
    }
  }

  private async executeCreateProviderTeam(workflowId: string): Promise<void> {
    // Implementation for creating provider team automatically
    console.log('Executing create provider team for workflow:', workflowId);
  }

  private async executeSetupPermissions(workflowId: string): Promise<void> {
    // Implementation for setting up permissions automatically
    console.log('Executing setup permissions for workflow:', workflowId);
  }

  private async executeSendWelcomeEmail(workflowId: string): Promise<void> {
    // Implementation for sending welcome email
    console.log('Executing send welcome email for workflow:', workflowId);
  }
}

export const providerWorkflowService = new ProviderWorkflowService();
