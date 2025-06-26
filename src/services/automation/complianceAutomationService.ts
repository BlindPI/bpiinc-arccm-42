import { supabase } from '@/integrations/supabase/client';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { ComplianceWorkflowEngine } from '@/services/compliance/complianceWorkflowEngine';

export interface AutomationSchedule {
  id: string;
  name: string;
  type: 'deadline_check' | 'progress_reminder' | 'inactivity_alert' | 'report_generation';
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface DeadlineCheckResult {
  processed: number;
  warnings: number;
  urgent: number;
  overdue: number;
}

export class ComplianceAutomationService {
  
  /**
   * Initialize automation scheduler with real database operations
   */
  static async initializeAutomationScheduler(): Promise<void> {
    try {
      console.log('Initializing compliance automation scheduler...');
      
      // Schedule various automation tasks
      await this.scheduleDeadlineChecks();
      await this.scheduleProgressReminders();
      await this.scheduleInactivityAlerts();
      
      console.log('Compliance automation scheduler initialized successfully');
    } catch (error) {
      console.error('Failed to initialize automation scheduler:', error);
      throw error;
    }
  }
  
  /**
   * Schedule daily deadline checks using real database queries
   */
  static async scheduleDeadlineChecks(): Promise<void> {
    const checkDeadlines = async (): Promise<DeadlineCheckResult> => {
      try {
        console.log('Running automated deadline checks...');
        
        // Get all active compliance records that need deadline checking
        const { data: complianceRecords, error } = await supabase
          .from('user_compliance_records')
          .select(`
            id,
            user_id,
            metric_id,
            compliance_status,
            next_check_due,
            compliance_metrics (
              id,
              name,
              category
            )
          `)
          .in('compliance_status', ['pending', 'warning', 'non_compliant'])
          .not('next_check_due', 'is', null);
        
        if (error) throw error;
        
        if (!complianceRecords || complianceRecords.length === 0) {
          return { processed: 0, warnings: 0, urgent: 0, overdue: 0 };
        }
        
        let warnings = 0;
        let urgent = 0;
        let overdue = 0;
        
        // Process each record to determine deadline status
        for (const record of complianceRecords) {
          if (!record.next_check_due) continue;
          
          const daysUntilDeadline = ComplianceAutomationService.calculateDaysUntilDeadline(record.next_check_due);
          
          // Trigger workflow based on deadline proximity
          if (daysUntilDeadline <= 7) { // Within 7 days
            await ComplianceWorkflowEngine.handleComplianceDeadlineWorkflow(
              record.user_id,
              record.metric_id,
              daysUntilDeadline
            );
            
            if (daysUntilDeadline <= 0) {
              overdue++;
            } else if (daysUntilDeadline <= 1) {
              urgent++;
            } else {
              warnings++;
            }
          }
        }
        
        const result = {
          processed: complianceRecords.length,
          warnings,
          urgent,
          overdue
        };
        
        // Log the automation run
        await ComplianceAutomationService.logAutomationRun('deadline_check', result);
        
        console.log(`Deadline check completed:`, result);
        return result;
        
      } catch (error) {
        console.error('Deadline check automation error:', error);
        throw error;
      }
    };
    
    // Run immediately for testing, then schedule daily
    await checkDeadlines();
    
    // In a real implementation, this would use a proper job scheduler
    // For now, we'll simulate with setInterval
    if (typeof window === 'undefined') { // Node.js environment
      setInterval(checkDeadlines, 24 * 60 * 60 * 1000); // Daily
    }
  }
  
  /**
   * Schedule weekly progress reminders using real user data
   */
  static async scheduleProgressReminders(): Promise<void> {
    const sendProgressReminders = async (): Promise<number> => {
      try {
        console.log('Running automated progress reminders...');
        
        // Get users with incomplete compliance requirements
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id, display_name, email, role, compliance_tier')
          .in('role', ['IT', 'IP', 'IC', 'AP']);
        
        if (error) throw error;
        
        if (!users || users.length === 0) {
          return 0;
        }
        
        let remindersSent = 0;
        
        // Send progress reminders to users with incomplete requirements
        for (const user of users) {
          try {
            const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(user.id);
            
            // Only send reminders to users who are not 100% complete
            if (tierInfo && tierInfo.completion_percentage < 100) {
              await ComplianceAutomationService.sendProgressReminder(user, tierInfo);
              remindersSent++;
            }
          } catch (userError) {
            console.error(`Error processing user ${user.id}:`, userError);
          }
        }
        
        // Log the automation run
        await ComplianceAutomationService.logAutomationRun('progress_reminder', { sent: remindersSent });
        
        console.log(`Progress reminders sent to ${remindersSent} users`);
        return remindersSent;
        
      } catch (error) {
        console.error('Progress reminder automation error:', error);
        throw error;
      }
    };
    
    // Run weekly on Mondays (in a real implementation)
    const msUntilNextMonday = ComplianceAutomationService.getMsUntilNextMonday();
    
    if (typeof window === 'undefined') { // Node.js environment
      setTimeout(() => {
        sendProgressReminders();
        setInterval(sendProgressReminders, 7 * 24 * 60 * 60 * 1000); // Weekly
      }, msUntilNextMonday);
    }
  }
  
  /**
   * Schedule inactivity alerts using real user activity data
   */
  static async scheduleInactivityAlerts(): Promise<void> {
    const checkInactiveUsers = async (): Promise<number> => {
      try {
        console.log('Running automated inactivity checks...');
        
        // Get users who haven't had recent compliance activity
        const { data: inactiveUsers, error } = await supabase
          .from('user_compliance_records')
          .select(`
            user_id,
            updated_at,
            profiles!user_compliance_records_user_id_fkey (
              id,
              display_name,
              email,
              role
            )
          `)
          .lt('updated_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // 14 days ago
          .order('updated_at', { ascending: true });
        
        if (error) throw error;
        
        if (!inactiveUsers || inactiveUsers.length === 0) {
          return 0;
        }
        
        let alertsSent = 0;
        const processedUsers = new Set<string>();
        
        // Process inactive users (deduplicate by user_id)
        for (const record of inactiveUsers) {
          if (!record.profiles || processedUsers.has(record.user_id)) {
            continue;
          }
          
          processedUsers.add(record.user_id);
          
          const daysInactive = Math.floor(
            (Date.now() - new Date(record.updated_at).getTime()) / (24 * 60 * 60 * 1000)
          );
          
          await ComplianceAutomationService.sendInactivityAlert(record.profiles, daysInactive);
          alertsSent++;
          
          // For users inactive more than 21 days, notify supervisors
          if (daysInactive > 21) {
            await ComplianceAutomationService.notifySupervisorsOfInactivity(record.profiles, daysInactive);
          }
        }
        
        // Log the automation run
        await ComplianceAutomationService.logAutomationRun('inactivity_alert', { sent: alertsSent });
        
        console.log(`Inactivity alerts sent for ${alertsSent} users`);
        return alertsSent;
        
      } catch (error) {
        console.error('Inactivity alert automation error:', error);
        throw error;
      }
    };
    
    // Run bi-weekly
    if (typeof window === 'undefined') { // Node.js environment
      setInterval(checkInactiveUsers, 14 * 24 * 60 * 60 * 1000);
    }
  }
  
  /**
   * Get automation status and statistics
   */
  static async getAutomationStatus(): Promise<{
    schedules: AutomationSchedule[];
    recentRuns: any[];
    totalProcessed: number;
  }> {
    try {
      // Get recent automation runs
      const { data: recentRuns, error } = await supabase
        .from('compliance_automation_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error && error.code !== 'PGRST116') { // Table doesn't exist
        throw error;
      }
      
      // Define current automation schedules
      const schedules: AutomationSchedule[] = [
        {
          id: 'deadline_check',
          name: 'Deadline Monitoring',
          type: 'deadline_check',
          frequency: 'daily',
          enabled: true,
          lastRun: recentRuns?.find(r => r.automation_type === 'deadline_check')?.created_at,
          nextRun: ComplianceAutomationService.calculateNextRun('daily')
        },
        {
          id: 'progress_reminder',
          name: 'Progress Reminders',
          type: 'progress_reminder',
          frequency: 'weekly',
          enabled: true,
          lastRun: recentRuns?.find(r => r.automation_type === 'progress_reminder')?.created_at,
          nextRun: ComplianceAutomationService.calculateNextRun('weekly')
        },
        {
          id: 'inactivity_alert',
          name: 'Inactivity Alerts',
          type: 'inactivity_alert',
          frequency: 'weekly',
          enabled: true,
          lastRun: recentRuns?.find(r => r.automation_type === 'inactivity_alert')?.created_at,
          nextRun: ComplianceAutomationService.calculateNextRun('weekly')
        }
      ];
      
      const totalProcessed = recentRuns?.reduce((sum, run) => 
        sum + (run.metadata?.processed || run.metadata?.sent || 0), 0) || 0;
      
      return {
        schedules,
        recentRuns: recentRuns || [],
        totalProcessed
      };
      
    } catch (error) {
      console.error('Error getting automation status:', error);
      return {
        schedules: [],
        recentRuns: [],
        totalProcessed: 0
      };
    }
  }
  
  // Helper methods for real functionality
  
  private static calculateDaysUntilDeadline(deadlineDate: string): number {
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  private static async sendProgressReminder(user: any, tierInfo: any): Promise<void> {
    try {
      // Create progress reminder as compliance action
      await ComplianceService.createComplianceAction({
        user_id: user.id,
        metric_id: 'progress_reminder',
        action_type: 'progress_reminder',
        title: 'Weekly Compliance Progress Update',
        description: `You're ${tierInfo.completion_percentage}% complete with your compliance requirements. Keep up the great work! ${tierInfo.total_requirements - tierInfo.completed_requirements} requirements remaining.`,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        priority: 'low'
      });
      
      console.log(`Progress reminder sent to user ${user.id} (${tierInfo.completion_percentage}% complete)`);
    } catch (error) {
      console.error(`Error sending progress reminder to user ${user.id}:`, error);
    }
  }
  
  private static async sendInactivityAlert(user: any, daysInactive: number): Promise<void> {
    try {
      // Create inactivity alert as compliance action
      await ComplianceService.createComplianceAction({
        user_id: user.id,
        metric_id: 'inactivity_alert',
        action_type: 'inactivity_alert',
        title: 'Compliance Activity Reminder',
        description: `We haven't seen any compliance activity from you in ${daysInactive} days. Please check your pending requirements to stay on track.`,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        priority: daysInactive > 21 ? 'high' : 'medium'
      });
      
      console.log(`Inactivity alert sent to user ${user.id} (${daysInactive} days inactive)`);
    } catch (error) {
      console.error(`Error sending inactivity alert to user ${user.id}:`, error);
    }
  }
  
  private static async notifySupervisorsOfInactivity(user: any, daysInactive: number): Promise<void> {
    try {
      // Get supervisors (Admin users for simplification)
      const { data: supervisors, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('role', 'SA'); // System Admin
      
      if (error || !supervisors || supervisors.length === 0) {
        console.log('No supervisors found for inactivity notification');
        return;
      }
      
      // Notify each supervisor
      for (const supervisor of supervisors) {
        await ComplianceService.createComplianceAction({
          user_id: supervisor.id,
          metric_id: 'supervisor_alert',
          action_type: 'supervisor_alert',
          title: 'Employee Compliance Inactivity',
          description: `${user.display_name || user.email} has been inactive for ${daysInactive} days. Please follow up on their compliance progress.`,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
          priority: 'high'
        });
      }
      
      console.log(`Supervisor notifications sent for inactive user ${user.id}`);
    } catch (error) {
      console.error(`Error notifying supervisors about inactive user ${user.id}:`, error);
    }
  }
  
  private static async logAutomationRun(
    automationType: string,
    metadata: any
  ): Promise<void> {
    try {
      await supabase
        .from('compliance_automation_log')
        .insert({
          automation_type: automationType,
          metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      // If automation log table doesn't exist, log to audit log instead
      try {
        await supabase
          .from('compliance_audit_log')
          .insert({
            user_id: 'system',
            audit_type: 'automation_run',
            notes: `${automationType} automation completed`,
            performed_by: 'system',
            old_value: metadata,
            created_at: new Date().toISOString()
          });
      } catch (auditError) {
        console.error('Error logging automation run:', auditError);
      }
    }
  }
  
  private static getMsUntilNextMonday(): number {
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(9, 0, 0, 0); // 9 AM
    
    return nextMonday.getTime() - now.getTime();
  }
  
  private static calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);
        return nextMonth.toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }
}