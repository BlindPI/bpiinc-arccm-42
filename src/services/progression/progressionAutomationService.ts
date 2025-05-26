
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserRole } from '@/types/supabase-schema';

export interface ProgressionEvaluation {
  eligible: boolean;
  score: number;
  requirementsMet: RequirementStatus[];
  blockers: ProgressionBlocker[];
  nextSteps: string[];
  error?: string;
}

export interface RequirementStatus {
  type: 'teaching_hours' | 'documents' | 'time_in_role' | 'assessments';
  name: string;
  completed: number;
  required: number;
  met: boolean;
  details?: any;
}

export interface ProgressionBlocker {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ProgressionResult {
  id: string;
  userId: string;
  fromRole: UserRole;
  toRole: UserRole;
  triggerType: 'manual' | 'automated' | 'scheduled';
  evaluationScore: number;
  requirementsMet: any;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  createdAt: string;
}

export interface DetailedReport {
  user: any;
  currentRole: UserRole;
  availableProgressions: AvailableProgression[];
  completedRequirements: RequirementStatus[];
  pendingRequirements: RequirementStatus[];
  history: ProgressionResult[];
  recommendations: string[];
}

export interface AvailableProgression {
  targetRole: UserRole;
  eligibility: ProgressionEvaluation;
  estimatedTimeToComplete: string;
}

export class ProgressionAutomationService {
  static async evaluateProgressionEligibility(
    userId: string, 
    targetRole: UserRole
  ): Promise<ProgressionEvaluation> {
    try {
      console.log('Evaluating progression eligibility:', { userId, targetRole });
      
      const { data, error } = await supabase.rpc('evaluate_progression_eligibility', {
        p_user_id: userId,
        p_target_role: targetRole
      });
      
      if (error) {
        console.error('Error evaluating progression:', error);
        throw error;
      }

      return this.parseEvaluationResult(data);
    } catch (error) {
      console.error('Error evaluating progression:', error);
      throw error;
    }
  }

  private static parseEvaluationResult(data: any): ProgressionEvaluation {
    const requirementsMet: RequirementStatus[] = (data.requirements_met || []).map((req: any) => ({
      type: req.type,
      name: this.getRequirementName(req.type),
      completed: req.completed,
      required: req.required,
      met: req.met,
      details: req
    }));

    const blockers: ProgressionBlocker[] = [];
    const nextSteps: string[] = [];

    // Generate blockers and next steps based on unmet requirements
    requirementsMet.forEach(req => {
      if (!req.met) {
        blockers.push({
          type: req.type,
          message: `${req.name}: ${req.completed}/${req.required} completed`,
          severity: req.completed === 0 ? 'high' : req.completed < req.required / 2 ? 'medium' : 'low'
        });
        
        nextSteps.push(`Complete ${req.required - req.completed} more ${req.name.toLowerCase()}`);
      }
    });

    if (data.error) {
      blockers.push({
        type: 'system',
        message: data.error,
        severity: 'high'
      });
    }

    return {
      eligible: data.eligible || false,
      score: data.score || 0,
      requirementsMet,
      blockers,
      nextSteps,
      error: data.error
    };
  }

  private static getRequirementName(type: string): string {
    const names = {
      'teaching_hours': 'Teaching Hours',
      'documents': 'Required Documents',
      'time_in_role': 'Time in Current Role',
      'assessments': 'Assessments'
    };
    return names[type as keyof typeof names] || type;
  }

  static async triggerAutomatedProgression(
    userId: string, 
    targetRole: UserRole
  ): Promise<ProgressionResult> {
    try {
      console.log('Triggering automated progression:', { userId, targetRole });
      
      // First evaluate eligibility
      const evaluation = await this.evaluateProgressionEligibility(userId, targetRole);
      
      if (!evaluation.eligible) {
        throw new Error('User not eligible for progression');
      }

      // Get current user role
      const currentRole = await this.getCurrentRole(userId);
      
      // Create progression record - fix the JSON serialization and column name
      const { data: progressionRecord, error } = await supabase
        .from('progression_history')
        .insert({
          user_id: userId, // Use the correct column name from database
          from_role: currentRole,
          to_role: targetRole,
          trigger_type: 'automated',
          evaluation_score: evaluation.score,
          requirements_met: JSON.parse(JSON.stringify(evaluation.requirementsMet)), // Convert to proper JSON
          status: evaluation.score >= 80 ? 'approved' : 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating progression record:', error);
        throw error;
      }

      // If auto-approved, update user role
      if (progressionRecord.status === 'approved') {
        await this.updateUserRole(userId, targetRole);
        await this.sendProgressionNotification(userId, targetRole, 'approved');
        toast.success(`Role automatically upgraded to ${targetRole}`);
      } else {
        toast.success('Progression request submitted for review');
      }

      return this.transformProgressionRecord(progressionRecord);
    } catch (error) {
      console.error('Error triggering progression:', error);
      throw error;
    }
  }

  static async generateProgressionReport(userId: string): Promise<DetailedReport> {
    try {
      console.log('Generating progression report for user:', userId);
      
      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get progression history
      const { data: progressHistory, error: historyError } = await supabase
        .from('progression_history')
        .select('*')
        .eq('user_id', userId) // Use correct column name
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // Get available progressions
      const availableProgressions = await this.getAvailableProgressions(userProfile.role as UserRole);
      
      // Get current requirements (mock data for now)
      const allRequirements = await this.getCurrentRequirements(userId, userProfile.role as UserRole);
      const completedRequirements = allRequirements.filter(r => r.met);
      const pendingRequirements = allRequirements.filter(r => !r.met);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(userId, pendingRequirements);

      return {
        user: userProfile,
        currentRole: userProfile.role as UserRole,
        availableProgressions,
        completedRequirements,
        pendingRequirements,
        history: (progressHistory || []).map(this.transformProgressionRecord),
        recommendations
      };
    } catch (error) {
      console.error('Error generating progression report:', error);
      throw error;
    }
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
    newRole: UserRole, 
    status: 'approved' | 'rejected'
  ): Promise<void> {
    const title = status === 'approved' 
      ? 'Role Progression Approved' 
      : 'Role Progression Rejected';
    
    const message = status === 'approved'
      ? `Congratulations! You have been promoted to ${newRole}.`
      : `Your progression request to ${newRole} has been rejected.`;

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: status === 'approved' ? 'SUCCESS' : 'ERROR',
        title,
        message,
        action_url: '/role-management'
      });

    if (error) {
      console.error('Error sending notification:', error);
    }
  }

  private static async getAvailableProgressions(currentRole: UserRole): Promise<AvailableProgression[]> {
    // Get progression triggers for current role
    const { data: triggers, error } = await supabase
      .from('progression_triggers')
      .select('*')
      .eq('from_role', currentRole);

    if (error) {
      console.error('Error getting progression triggers:', error);
      return [];
    }

    // For now, return mock data - in production this would evaluate each possible progression
    const progressions: AvailableProgression[] = [];
    
    for (const trigger of triggers || []) {
      progressions.push({
        targetRole: trigger.to_role as UserRole,
        eligibility: {
          eligible: false,
          score: 0,
          requirementsMet: [],
          blockers: [],
          nextSteps: []
        },
        estimatedTimeToComplete: '2-4 weeks'
      });
    }

    return progressions;
  }

  private static async getCurrentRequirements(userId: string, currentRole: UserRole): Promise<RequirementStatus[]> {
    // Mock requirements - in production this would fetch from progression_requirements
    return [
      {
        type: 'teaching_hours',
        name: 'Teaching Hours',
        completed: 25,
        required: 40,
        met: false
      },
      {
        type: 'documents',
        name: 'Required Documents',
        completed: 2,
        required: 3,
        met: false
      },
      {
        type: 'time_in_role',
        name: 'Time in Current Role',
        completed: 45,
        required: 30,
        met: true
      }
    ];
  }

  private static async generateRecommendations(
    userId: string, 
    pendingRequirements: RequirementStatus[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    pendingRequirements.forEach(req => {
      switch (req.type) {
        case 'teaching_hours':
          recommendations.push(`Log ${req.required - req.completed} more teaching hours to meet requirements`);
          break;
        case 'documents':
          recommendations.push(`Submit ${req.required - req.completed} additional required documents`);
          break;
        case 'time_in_role':
          recommendations.push(`Wait ${req.required - req.completed} more days in current role`);
          break;
        default:
          recommendations.push(`Complete remaining ${req.name.toLowerCase()} requirements`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('You have met all basic requirements! Consider requesting a role progression.');
    }

    return recommendations;
  }

  private static transformProgressionRecord(record: any): ProgressionResult {
    return {
      id: record.id,
      userId: record.user_id,
      fromRole: record.from_role as UserRole,
      toRole: record.to_role as UserRole,
      triggerType: record.trigger_type,
      evaluationScore: record.evaluation_score || 0,
      requirementsMet: record.requirements_met || {},
      status: record.status,
      createdAt: record.created_at
    };
  }
}
