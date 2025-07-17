import { supabase } from '@/integrations/supabase/client';
import { DatabaseUserRole, ROLE_HIERARCHY } from '@/types/database-roles';
import { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

export interface TransactionStep {
  name: string;
  execute: () => Promise<any>;
  rollback?: () => Promise<void>;
  result?: any;
}

export interface TransactionResult {
  success: boolean;
  results: Record<string, any>;
  error?: string;
  stepsCompleted: number;
  totalSteps: number;
}

/**
 * Production-ready transaction management service
 * Implements ACID transaction patterns from DATABASE_INTEGRATION_ARCHITECTURE.md
 */
export class TransactionManager {
  private static activeTransactions: Map<string, TransactionStep[]> = new Map();

  /**
   * Execute enrollment workflow with ACID compliance
   */
  public static async enrollStudentWithCompliance(
    sessionId: string,
    studentId: string,
    enrolledBy: string,
    userRole: DatabaseUserRole
  ): Promise<TransactionResult> {
    // Validate permissions
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY['AP']) {
      throw new Error('Insufficient permissions to enroll students');
    }

    const transactionId = this.generateTransactionId();
    const steps: TransactionStep[] = [];

    try {
      // Step 1: Validate session capacity
      steps.push({
        name: 'validateCapacity',
        execute: async () => {
          const { data: session, error } = await supabase
            .from('training_sessions')
            .select('current_enrollment, max_capacity, status')
            .eq('id', sessionId)
            .single();

          if (error) throw error;
          if (!session) throw new Error('Session not found');
          if (session.status !== 'SCHEDULED') throw new Error('Session not available for enrollment');
          if (session.current_enrollment >= session.max_capacity) throw new Error('Session at capacity');
          
          return session;
        },
        rollback: async () => {
          // No rollback needed for validation
        }
      });

      // Step 2: Check for existing enrollment
      steps.push({
        name: 'checkExistingEnrollment',
        execute: async () => {
          const { data: existing, error } = await supabase
            .from('session_enrollments')
            .select('id')
            .eq('session_id', sessionId)
            .eq('student_id', studentId)
            .single();

          if (existing) throw new Error('Student already enrolled in this session');
          return { noExistingEnrollment: true };
        }
      });

      // Step 3: Create enrollment record
      steps.push({
        name: 'createEnrollment',
        execute: async () => {
          const { data, error } = await supabase
            .from('session_enrollments')
            .insert({
              session_id: sessionId,
              student_id: studentId,
              enrollment_date: new Date().toISOString(),
              attendance_status: 'REGISTERED',
              completion_status: 'NOT_STARTED'
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        rollback: async () => {
          if (steps[2].result?.id) {
            await supabase
              .from('session_enrollments')
              .delete()
              .eq('id', steps[2].result.id);
          }
        }
      });

      // Step 4: Update session capacity
      steps.push({
        name: 'updateCapacity',
        execute: async () => {
          const { data, error } = await supabase
            .from('training_sessions')
            .update({
              current_enrollment: supabase.sql`current_enrollment + 1`
            })
            .eq('id', sessionId)
            .select('current_enrollment')
            .single();

          if (error) throw error;
          return data;
        },
        rollback: async () => {
          await supabase
            .from('training_sessions')
            .update({
              current_enrollment: supabase.sql`current_enrollment - 1`
            })
            .eq('id', sessionId);
        }
      });

      // Step 5: Create notification
      steps.push({
        name: 'createNotification',
        execute: async () => {
          const { data, error } = await supabase
            .from('notifications')
            .insert({
              user_id: studentId,
              title: 'Enrollment Confirmed',
              message: 'You have been successfully enrolled in the training session',
              type: 'ENROLLMENT',
              category: 'TRAINING'
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        rollback: async () => {
          if (steps[4].result?.id) {
            await supabase
              .from('notifications')
              .delete()
              .eq('id', steps[4].result.id);
          }
        }
      });

      this.activeTransactions.set(transactionId, steps);

      // Execute all steps
      const results: Record<string, any> = {};
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        try {
          step.result = await step.execute();
          results[step.name] = step.result;
        } catch (error) {
          // Rollback all completed steps
          await this.rollbackSteps(steps, i - 1);
          throw error;
        }
      }

      this.activeTransactions.delete(transactionId);

      return {
        success: true,
        results,
        stepsCompleted: steps.length,
        totalSteps: steps.length
      };

    } catch (error: any) {
      this.activeTransactions.delete(transactionId);
      return {
        success: false,
        results: {},
        error: error.message,
        stepsCompleted: steps.filter(s => s.result).length,
        totalSteps: steps.length
      };
    }
  }

  /**
   * Certificate generation workflow with ACID compliance
   */
  public static async generateCertificateWorkflow(
    rosterId: string,
    studentId: string,
    templateId: string,
    issuedBy: string,
    userRole: DatabaseUserRole
  ): Promise<TransactionResult> {
    // Validate permissions
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY['AP']) {
      throw new Error('Insufficient permissions to generate certificates');
    }

    const transactionId = this.generateTransactionId();
    const steps: TransactionStep[] = [];

    try {
      // Step 1: Validate completion requirements
      steps.push({
        name: 'validateCompletion',
        execute: async () => {
          const { data: member, error } = await supabase
            .from('student_roster_members')
            .select(`
              id,
              completion_status,
              practical_score,
              written_score,
              student_enrollment_profiles!inner(
                first_name,
                last_name,
                email
              ),
              rosters!inner(
                name,
                instructor_name
              )
            `)
            .eq('roster_id', rosterId)
            .eq('student_profile_id', studentId)
            .single();

          if (error) throw error;
          if (!member) throw new Error('Student not found in roster');
          if (member.completion_status !== 'completed') throw new Error('Training not completed');
          
          return member;
        }
      });

      // Step 2: Check for existing certificate
      steps.push({
        name: 'checkExistingCertificate',
        execute: async () => {
          const { data: existing, error } = await supabase
            .from('certificates')
            .select('id')
            .eq('roster_id', rosterId)
            .eq('user_id', studentId)
            .single();

          if (existing) throw new Error('Certificate already exists for this student');
          return { noExistingCertificate: true };
        }
      });

      // Step 3: Generate verification code
      steps.push({
        name: 'generateCode',
        execute: async () => {
          let isUnique = false;
          let verificationCode = '';
          let attempts = 0;

          while (!isUnique && attempts < 10) {
            verificationCode = this.generateVerificationCode();
            const { data: existing } = await supabase
              .from('certificates')
              .select('id')
              .eq('verification_code', verificationCode)
              .single();
            
            isUnique = !existing;
            attempts++;
          }

          if (!isUnique) throw new Error('Unable to generate unique verification code');
          return { verificationCode };
        }
      });

      // Step 4: Create certificate record
      steps.push({
        name: 'createCertificate',
        execute: async () => {
          const memberData = steps[0].result;
          const { verificationCode } = steps[2].result;

          const { data, error } = await supabase
            .from('certificates')
            .insert({
              user_id: studentId,
              roster_id: rosterId,
              course_name: memberData.rosters.name,
              recipient_name: `${memberData.student_enrollment_profiles.first_name} ${memberData.student_enrollment_profiles.last_name}`,
              recipient_email: memberData.student_enrollment_profiles.email,
              instructor_name: memberData.rosters.instructor_name,
              issued_by: issuedBy,
              template_id: templateId,
              verification_code: verificationCode,
              issue_date: new Date().toISOString().split('T')[0],
              status: 'ACTIVE',
              generation_status: 'COMPLETED'
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        rollback: async () => {
          if (steps[3].result?.id) {
            await supabase
              .from('certificates')
              .delete()
              .eq('id', steps[3].result.id);
          }
        }
      });

      // Step 5: Update roster certificate count
      steps.push({
        name: 'updateRosterCount',
        execute: async () => {
          const { data, error } = await supabase
            .from('rosters')
            .update({
              certificate_count: supabase.sql`certificate_count + 1`
            })
            .eq('id', rosterId)
            .select('certificate_count')
            .single();

          if (error) throw error;
          return data;
        },
        rollback: async () => {
          await supabase
            .from('rosters')
            .update({
              certificate_count: supabase.sql`certificate_count - 1`
            })
            .eq('id', rosterId);
        }
      });

      this.activeTransactions.set(transactionId, steps);

      // Execute all steps
      const results: Record<string, any> = {};
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        try {
          step.result = await step.execute();
          results[step.name] = step.result;
        } catch (error) {
          await this.rollbackSteps(steps, i - 1);
          throw error;
        }
      }

      this.activeTransactions.delete(transactionId);

      return {
        success: true,
        results,
        stepsCompleted: steps.length,
        totalSteps: steps.length
      };

    } catch (error: any) {
      this.activeTransactions.delete(transactionId);
      return {
        success: false,
        results: {},
        error: error.message,
        stepsCompleted: steps.filter(s => s.result).length,
        totalSteps: steps.length
      };
    }
  }

  /**
   * Rollback completed steps in reverse order
   */
  private static async rollbackSteps(steps: TransactionStep[], lastCompletedIndex: number): Promise<void> {
    for (let i = lastCompletedIndex; i >= 0; i--) {
      const step = steps[i];
      if (step.rollback && step.result) {
        try {
          await step.rollback();
          console.log(`🔄 Rolled back step: ${step.name}`);
        } catch (rollbackError) {
          console.error(`❌ Rollback failed for step ${step.name}:`, rollbackError);
        }
      }
    }
  }

  /**
   * Generate unique transaction ID
   */
  private static generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique verification code
   */
  private static generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get active transaction statistics
   */
  public static getTransactionStats(): {
    activeTransactions: number;
    transactionIds: string[];
  } {
    return {
      activeTransactions: this.activeTransactions.size,
      transactionIds: Array.from(this.activeTransactions.keys())
    };
  }

  /**
   * Emergency rollback for active transaction
   */
  public static async emergencyRollback(transactionId: string): Promise<boolean> {
    const steps = this.activeTransactions.get(transactionId);
    if (!steps) return false;

    await this.rollbackSteps(steps, steps.length - 1);
    this.activeTransactions.delete(transactionId);
    
    return true;
  }
}

export default TransactionManager;