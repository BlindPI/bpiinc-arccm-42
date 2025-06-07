
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types/supabase-schema';

export interface ProgressionEvaluation {
  eligible: boolean;
  score: number;
  requirementsMet: RequirementStatus[];
  blockers: ProgressionBlocker[];
  nextSteps: string[];
}

export interface RequirementStatus {
  type: 'hours' | 'courses' | 'assessments' | 'supervision';
  name: string;
  completed: boolean;
  progress: number;
  details: any;
}

export interface ProgressionBlocker {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DetailedReport {
  user: any;
  currentRole: UserRole;
  availableProgressions: AvailableProgression[];
  completedRequirements: RequirementStatus[];
  pendingRequirements: RequirementStatus[];
  history: any[];
  recommendations: string[];
}

export interface AvailableProgression {
  targetRole: UserRole;
  title: string;
  description: string;
  requirements: RequirementStatus[];
  estimatedTimeToComplete: string;
  autoEligible: boolean;
}

export interface ProgressionResult {
  id: string;
  user_id: string;
  from_role: UserRole;
  to_role: UserRole;
  trigger_type: 'manual' | 'automated' | 'scheduled';
  evaluation_score: number;
  requirements_met: RequirementStatus[];
  approved_by?: string;
  approved_at?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export class ProgressionAutomationService {
  static async evaluateProgressionEligibility(
    userId: string, 
    targetRole: UserRole
  ): Promise<ProgressionEvaluation> {
    try {
      const { data, error } = await supabase.rpc('evaluate_progression_eligibility', {
        p_user_id: userId,
        p_target_role: targetRole
      });
      
      if (error) throw error;
      
      return this.parseEvaluationResult(data);
    } catch (error) {
      console.error('Error evaluating progression:', error);
      throw error;
    }
  }

  static async triggerAutomatedProgression(
    userId: string, 
    targetRole: UserRole
  ): Promise<ProgressionResult> {
    const evaluation = await this.evaluateProgressionEligibility(userId, targetRole);
    
    if (!evaluation.eligible) {
      throw new Error('User not eligible for progression');
    }

    // Get current user role
    const currentRole = await this.getCurrentRole(userId);

    // Create progression record
    const { data: progressionRecord, error } = await supabase
      .from('role_transition_requests')
      .insert({
        user_id: userId,
        from_role: currentRole,
        to_role: targetRole,
        status: evaluation.score >= 80 ? 'APPROVED' : 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    // If auto-approved, update user role
    if (progressionRecord.status === 'APPROVED') {
      await this.updateUserRole(userId, targetRole);
      await this.sendProgressionNotification(userId, targetRole, 'approved');
    }

    return {
      id: progressionRecord.id,
      user_id: userId,
      from_role: currentRole,
      to_role: targetRole,
      trigger_type: 'automated',
      evaluation_score: evaluation.score,
      requirements_met: evaluation.requirementsMet,
      status: progressionRecord.status === 'APPROVED' ? 'approved' : 'pending'
    };
  }

  static async generateProgressionReport(userId: string): Promise<DetailedReport> {
    const userProfile = await this.getUserProfile(userId);
    const currentRequirements = await this.getCurrentRequirements(userId);
    const progressHistory = await this.getProgressionHistory(userId);
    
    return {
      user: userProfile,
      currentRole: userProfile.role,
      availableProgressions: await this.getAvailableProgressions(userProfile.role),
      completedRequirements: currentRequirements.filter(r => r.completed),
      pendingRequirements: currentRequirements.filter(r => !r.completed),
      history: progressHistory,
      recommendations: await this.generateRecommendations(userId)
    };
  }

  private static parseEvaluationResult(data: any): ProgressionEvaluation {
    return {
      eligible: data?.eligible || false,
      score: data?.score || 0,
      requirementsMet: data?.requirements_met || [],
      blockers: [],
      nextSteps: []
    };
  }

  private static async getCurrentRole(userId: string): Promise<UserRole> {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.role as UserRole;
  }

  private static async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
  }

  private static async sendProgressionNotification(
    userId: string, 
    targetRole: UserRole, 
    status: 'approved' | 'rejected'
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: status === 'approved' ? 'SUCCESS' : 'ERROR',
        title: status === 'approved' ? 'Role Progression Approved' : 'Role Progression Rejected',
        message: `Your progression to ${targetRole} has been ${status}.`,
        read: false
      });

    if (error) {
      console.error('Error sending progression notification:', error);
    }
  }

  private static async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  private static async getCurrentRequirements(userId: string): Promise<RequirementStatus[]> {
    // Mock implementation - replace with actual requirements logic
    return [
      {
        type: 'hours',
        name: 'Teaching Hours',
        completed: false,
        progress: 60,
        details: { current: 12, required: 20 }
      },
      {
        type: 'courses',
        name: 'Required Courses',
        completed: true,
        progress: 100,
        details: { current: 3, required: 3 }
      }
    ];
  }

  private static async getProgressionHistory(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('role_transition_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching progression history:', error);
      return [];
    }

    return data || [];
  }

  private static async getAvailableProgressions(currentRole: UserRole): Promise<AvailableProgression[]> {
    // Mock implementation - replace with actual progression paths logic
    const progressionMap: Record<UserRole, AvailableProgression[]> = {
      'IT': [{
        targetRole: 'IP',
        title: 'Instructor Provisional',
        description: 'Progress to provisional instructor status',
        requirements: [],
        estimatedTimeToComplete: '3-6 months',
        autoEligible: false
      }],
      'IP': [{
        targetRole: 'IC',
        title: 'Instructor Certified',
        description: 'Progress to certified instructor status',
        requirements: [],
        estimatedTimeToComplete: '6-12 months',
        autoEligible: false
      }],
      'IC': [{
        targetRole: 'AP',
        title: 'Authorized Provider',
        description: 'Progress to authorized provider status',
        requirements: [],
        estimatedTimeToComplete: '12+ months',
        autoEligible: false
      }],
      'AP': [],
      'AD': [],
      'SA': [],
      'IN': [{
        targetRole: 'IT',
        title: 'Instructor Trainee',
        description: 'Begin instructor training path',
        requirements: [],
        estimatedTimeToComplete: '1-3 months',
        autoEligible: false
      }]
    };

    return progressionMap[currentRole] || [];
  }

  private static async generateRecommendations(userId: string): Promise<string[]> {
    // Mock implementation - replace with actual recommendations logic
    return [
      'Complete remaining teaching hours requirement',
      'Submit required documentation',
      'Schedule evaluation session'
    ];
  }
}
