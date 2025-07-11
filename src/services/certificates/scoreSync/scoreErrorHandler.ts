/**
 * Score Synchronization Error Handling Service
 * 
 * Comprehensive error handling for score data import, validation,
 * and synchronization operations. Provides detailed error classification,
 * recovery strategies, and user-friendly error messaging.
 */

import { supabase } from '@/integrations/supabase/client';

export interface ScoreError {
  id: string;
  type: ScoreErrorType;
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, any>;
  context?: ScoreErrorContext;
  timestamp: Date;
  source: 'thinkific' | 'database' | 'validation' | 'calculation';
  recoverable: boolean;
  retryable: boolean;
  userMessage: string;
}

export enum ScoreErrorType {
  // API Connection Errors
  THINKIFIC_CONNECTION_FAILED = 'thinkific_connection_failed',
  THINKIFIC_AUTH_FAILED = 'thinkific_auth_failed',
  THINKIFIC_RATE_LIMIT = 'thinkific_rate_limit',
  THINKIFIC_API_ERROR = 'thinkific_api_error',
  
  // Data Validation Errors
  INVALID_SCORE_RANGE = 'invalid_score_range',
  MISSING_REQUIRED_SCORES = 'missing_required_scores',
  SCORE_FORMAT_ERROR = 'score_format_error',
  THRESHOLD_VALIDATION_ERROR = 'threshold_validation_error',
  
  // Database Errors
  DATABASE_CONNECTION_ERROR = 'database_connection_error',
  FOREIGN_KEY_CONSTRAINT = 'foreign_key_constraint',
  UNIQUE_CONSTRAINT_VIOLATION = 'unique_constraint_violation',
  PERMISSION_DENIED = 'permission_denied',
  
  // Business Logic Errors
  CALCULATION_ERROR = 'calculation_error',
  STATUS_DETERMINATION_ERROR = 'status_determination_error',
  WEIGHT_VALIDATION_ERROR = 'weight_validation_error',
  
  // Data Consistency Errors
  STUDENT_NOT_FOUND = 'student_not_found',
  COURSE_NOT_FOUND = 'course_not_found',
  ENROLLMENT_MISMATCH = 'enrollment_mismatch',
  DUPLICATE_SCORE_RECORD = 'duplicate_score_record',
  
  // System Errors
  TIMEOUT_ERROR = 'timeout_error',
  MEMORY_ERROR = 'memory_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export interface ScoreErrorContext {
  certificateRequestId?: string;
  studentId?: string;
  courseId?: string;
  practicalScore?: number;
  writtenScore?: number;
  operation?: string;
  batchId?: string;
  retryAttempt?: number;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'skip' | 'manual_intervention' | 'fallback' | 'ignore';
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: () => Promise<void>;
  userPrompt?: string;
}

export interface ErrorHandlingResult {
  success: boolean;
  errors: ScoreError[];
  warnings: ScoreError[];
  recoveredErrors: ScoreError[];
  unrecoverableErrors: ScoreError[];
  summary: ErrorSummary;
}

export interface ErrorSummary {
  totalErrors: number;
  criticalErrors: number;
  recoverableErrors: number;
  warnings: number;
  successfulRecoveries: number;
  requiresManualIntervention: boolean;
}

/**
 * Main error handling service for score synchronization
 */
export class ScoreErrorHandler {
  private errors: ScoreError[] = [];
  private recoveryStrategies: Map<ScoreErrorType, ErrorRecoveryStrategy> = new Map();

  constructor() {
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize default recovery strategies for different error types
   */
  private initializeRecoveryStrategies() {
    // API Connection Errors
    this.recoveryStrategies.set(ScoreErrorType.THINKIFIC_CONNECTION_FAILED, {
      type: 'retry',
      maxRetries: 3,
      retryDelay: 5000,
      userPrompt: 'Network connection failed. Retrying...'
    });

    this.recoveryStrategies.set(ScoreErrorType.THINKIFIC_RATE_LIMIT, {
      type: 'retry',
      maxRetries: 5,
      retryDelay: 60000, // 1 minute delay for rate limits
      userPrompt: 'API rate limit reached. Waiting before retry...'
    });

    this.recoveryStrategies.set(ScoreErrorType.THINKIFIC_AUTH_FAILED, {
      type: 'manual_intervention',
      userPrompt: 'Authentication failed. Please check API credentials.'
    });

    // Data Validation Errors
    this.recoveryStrategies.set(ScoreErrorType.INVALID_SCORE_RANGE, {
      type: 'skip',
      userPrompt: 'Invalid score detected. Record will be skipped and flagged for review.'
    });

    this.recoveryStrategies.set(ScoreErrorType.MISSING_REQUIRED_SCORES, {
      type: 'skip',
      userPrompt: 'Required scores missing. Record marked as pending.'
    });

    // Database Errors
    this.recoveryStrategies.set(ScoreErrorType.DATABASE_CONNECTION_ERROR, {
      type: 'retry',
      maxRetries: 3,
      retryDelay: 2000
    });

    this.recoveryStrategies.set(ScoreErrorType.FOREIGN_KEY_CONSTRAINT, {
      type: 'manual_intervention',
      userPrompt: 'Data integrity issue detected. Manual review required.'
    });

    // Business Logic Errors
    this.recoveryStrategies.set(ScoreErrorType.CALCULATION_ERROR, {
      type: 'fallback',
      userPrompt: 'Score calculation failed. Using manual review status.'
    });

    // System Errors
    this.recoveryStrategies.set(ScoreErrorType.TIMEOUT_ERROR, {
      type: 'retry',
      maxRetries: 2,
      retryDelay: 10000
    });
  }

  /**
   * Handle an error during score synchronization
   */
  async handleError(
    error: Error | ScoreError,
    context?: ScoreErrorContext,
    source: ScoreError['source'] = 'validation'
  ): Promise<ScoreError> {
    let scoreError: ScoreError;

    if (this.isScoreError(error)) {
      scoreError = error;
    } else {
      scoreError = this.classifyError(error, context, source);
    }

    this.errors.push(scoreError);

    // Log error to console and database
    await this.logError(scoreError);

    // Attempt automatic recovery if possible
    if (scoreError.recoverable) {
      await this.attemptRecovery(scoreError);
    }

    return scoreError;
  }

  /**
   * Classify a generic error into a specific ScoreError
   */
  private classifyError(
    error: Error,
    context?: ScoreErrorContext,
    source: ScoreError['source'] = 'validation'
  ): ScoreError {
    const errorMessage = error.message.toLowerCase();
    const errorId = this.generateErrorId();

    // Classify based on error message patterns
    let type: ScoreErrorType;
    let severity: ScoreError['severity'];
    let recoverable: boolean;
    let retryable: boolean;
    let userMessage: string;

    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      type = ScoreErrorType.THINKIFIC_CONNECTION_FAILED;
      severity = 'error';
      recoverable = true;
      retryable = true;
      userMessage = 'Network connection failed. This will be retried automatically.';
    } else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
      type = ScoreErrorType.THINKIFIC_AUTH_FAILED;
      severity = 'critical';
      recoverable = false;
      retryable = false;
      userMessage = 'Authentication failed. Please check your API credentials.';
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      type = ScoreErrorType.THINKIFIC_RATE_LIMIT;
      severity = 'warning';
      recoverable = true;
      retryable = true;
      userMessage = 'API rate limit reached. Operation will continue after a brief delay.';
    } else if (errorMessage.includes('timeout')) {
      type = ScoreErrorType.TIMEOUT_ERROR;
      severity = 'error';
      recoverable = true;
      retryable = true;
      userMessage = 'Request timed out. This will be retried automatically.';
    } else if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
      type = ScoreErrorType.FOREIGN_KEY_CONSTRAINT;
      severity = 'error';
      recoverable = false;
      retryable = false;
      userMessage = 'Data integrity issue detected. Manual review required.';
    } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      type = ScoreErrorType.PERMISSION_DENIED;
      severity = 'critical';
      recoverable = false;
      retryable = false;
      userMessage = 'Permission denied. Please check your access rights.';
    } else {
      type = ScoreErrorType.UNKNOWN_ERROR;
      severity = 'error';
      recoverable = false;
      retryable = false;
      userMessage = 'An unexpected error occurred. Please contact support if this persists.';
    }

    return {
      id: errorId,
      type,
      severity,
      message: error.message,
      details: {
        stack: error.stack,
        name: error.name
      },
      context,
      timestamp: new Date(),
      source,
      recoverable,
      retryable,
      userMessage
    };
  }

  /**
   * Attempt to recover from an error
   */
  private async attemptRecovery(scoreError: ScoreError): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(scoreError.type);
    if (!strategy) {
      return false;
    }

    const context = scoreError.context || {};
    const currentRetry = context.retryAttempt || 0;

    switch (strategy.type) {
      case 'retry':
        if (currentRetry < (strategy.maxRetries || 1)) {
          if (strategy.retryDelay) {
            await this.delay(strategy.retryDelay);
          }
          
          // Update retry context
          scoreError.context = {
            ...context,
            retryAttempt: currentRetry + 1
          };
          
          return true; // Indicate that retry should be attempted
        }
        break;

      case 'fallback':
        if (strategy.fallbackAction) {
          try {
            await strategy.fallbackAction();
            return true;
          } catch (fallbackError) {
            console.error('Fallback action failed:', fallbackError);
          }
        }
        break;

      case 'skip':
        // Mark the record for manual review
        if (context.certificateRequestId) {
          await this.markForManualReview(context.certificateRequestId, scoreError);
        }
        return true;

      case 'ignore':
        return true;

      case 'manual_intervention':
        // Log for manual intervention but don't attempt automatic recovery
        await this.logForManualIntervention(scoreError);
        return false;
    }

    return false;
  }

  /**
   * Mark a certificate request for manual review
   */
  private async markForManualReview(requestId: string, error: ScoreError): Promise<void> {
    try {
      await supabase
        .from('certificate_request')
        .update({
          status: 'MANUAL_REVIEW',
          notes: `Error during score sync: ${error.userMessage}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
    } catch (dbError) {
      console.error('Failed to mark request for manual review:', dbError);
    }
  }

  /**
   * Log error for manual intervention
   */
  private async logForManualIntervention(error: ScoreError): Promise<void> {
    try {
      await supabase
        .from('score_sync_errors')
        .insert({
          error_id: error.id,
          error_type: error.type,
          severity: error.severity,
          message: error.message,
          context: error.context,
          requires_manual_intervention: true,
          created_at: error.timestamp.toISOString()
        });
    } catch (dbError) {
      console.error('Failed to log error for manual intervention:', dbError);
    }
  }

  /**
   * Log error to database
   */
  private async logError(error: ScoreError): Promise<void> {
    try {
      await supabase
        .from('score_sync_errors')
        .insert({
          error_id: error.id,
          error_type: error.type,
          severity: error.severity,
          message: error.message,
          details: error.details,
          context: error.context,
          source: error.source,
          recoverable: error.recoverable,
          retryable: error.retryable,
          created_at: error.timestamp.toISOString()
        });
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
  }

  /**
   * Create validation error for invalid scores
   */
  createValidationError(
    type: ScoreErrorType,
    message: string,
    context?: ScoreErrorContext
  ): ScoreError {
    return {
      id: this.generateErrorId(),
      type,
      severity: 'warning',
      message,
      context,
      timestamp: new Date(),
      source: 'validation',
      recoverable: true,
      retryable: false,
      userMessage: this.getUserFriendlyMessage(type, message)
    };
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(type: ScoreErrorType, originalMessage: string): string {
    const friendlyMessages: Record<ScoreErrorType, string> = {
      [ScoreErrorType.INVALID_SCORE_RANGE]: 'Score must be between 0 and 100',
      [ScoreErrorType.MISSING_REQUIRED_SCORES]: 'Both practical and written scores are required',
      [ScoreErrorType.THRESHOLD_VALIDATION_ERROR]: 'Pass threshold must be between 0 and 100',
      [ScoreErrorType.STUDENT_NOT_FOUND]: 'Student record not found in the system',
      [ScoreErrorType.COURSE_NOT_FOUND]: 'Course not found in Thinkific',
      [ScoreErrorType.ENROLLMENT_MISMATCH]: 'Student enrollment data does not match',
      [ScoreErrorType.CALCULATION_ERROR]: 'Error calculating final score',
      [ScoreErrorType.THINKIFIC_CONNECTION_FAILED]: 'Unable to connect to Thinkific API',
      [ScoreErrorType.THINKIFIC_AUTH_FAILED]: 'Authentication with Thinkific failed',
      [ScoreErrorType.THINKIFIC_RATE_LIMIT]: 'Thinkific API rate limit reached',
      [ScoreErrorType.DATABASE_CONNECTION_ERROR]: 'Database connection error',
      [ScoreErrorType.PERMISSION_DENIED]: 'Access denied',
      [ScoreErrorType.TIMEOUT_ERROR]: 'Request timed out',
      [ScoreErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred'
    } as Record<ScoreErrorType, string>;

    return friendlyMessages[type] || originalMessage;
  }

  /**
   * Get summary of all errors
   */
  getErrorSummary(): ErrorSummary {
    const totalErrors = this.errors.length;
    const criticalErrors = this.errors.filter(e => e.severity === 'critical').length;
    const recoverableErrors = this.errors.filter(e => e.recoverable).length;
    const warnings = this.errors.filter(e => e.severity === 'warning').length;
    const successfulRecoveries = this.errors.filter(e => 
      e.recoverable && e.context?.retryAttempt && e.context.retryAttempt > 0
    ).length;
    const requiresManualIntervention = this.errors.some(e => 
      !e.recoverable || e.severity === 'critical'
    );

    return {
      totalErrors,
      criticalErrors,
      recoverableErrors,
      warnings,
      successfulRecoveries,
      requiresManualIntervention
    };
  }

  /**
   * Get all errors by severity
   */
  getErrorsBySeverity(severity: ScoreError['severity']): ScoreError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Get all errors by type
   */
  getErrorsByType(type: ScoreErrorType): ScoreError[] {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if error is already a ScoreError
   */
  private isScoreError(error: any): error is ScoreError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process multiple errors and return comprehensive result
   */
  async processErrors(errors: (Error | ScoreError)[]): Promise<ErrorHandlingResult> {
    const processedErrors: ScoreError[] = [];
    const warnings: ScoreError[] = [];
    const recoveredErrors: ScoreError[] = [];
    const unrecoverableErrors: ScoreError[] = [];

    for (const error of errors) {
      const scoreError = await this.handleError(error);
      processedErrors.push(scoreError);

      if (scoreError.severity === 'warning') {
        warnings.push(scoreError);
      } else if (scoreError.recoverable) {
        const recovered = await this.attemptRecovery(scoreError);
        if (recovered) {
          recoveredErrors.push(scoreError);
        } else {
          unrecoverableErrors.push(scoreError);
        }
      } else {
        unrecoverableErrors.push(scoreError);
      }
    }

    return {
      success: unrecoverableErrors.length === 0,
      errors: processedErrors,
      warnings,
      recoveredErrors,
      unrecoverableErrors,
      summary: this.getErrorSummary()
    };
  }
}

/**
 * Global error handler instance
 */
export const scoreErrorHandler = new ScoreErrorHandler();