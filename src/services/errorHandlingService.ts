
export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export interface StandardError {
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  timestamp: Date;
}

export class ErrorHandlingService {
  static formatError(error: any, context: ErrorContext): StandardError {
    let message = 'An unexpected error occurred';
    let code = 'UNKNOWN_ERROR';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Categorize common errors
    if (message.includes('permission') || message.includes('unauthorized')) {
      code = 'PERMISSION_ERROR';
      severity = 'high';
    } else if (message.includes('network') || message.includes('fetch')) {
      code = 'NETWORK_ERROR';
      severity = 'medium';
    } else if (message.includes('validation') || message.includes('invalid')) {
      code = 'VALIDATION_ERROR';
      severity = 'low';
    } else if (message.includes('rate limit')) {
      code = 'RATE_LIMIT_ERROR';
      severity = 'medium';
    }

    return {
      message,
      code,
      severity,
      context,
      timestamp: new Date()
    };
  }

  static async logError(error: StandardError): Promise<void> {
    try {
      console.error('Application Error:', {
        code: error.code,
        message: error.message,
        severity: error.severity,
        context: error.context,
        timestamp: error.timestamp
      });

      // Log to audit system for high/critical errors
      if (error.severity === 'high' || error.severity === 'critical') {
        const { supabase } = await import('@/integrations/supabase/client');
        
        await supabase.rpc('log_admin_action', {
          action_type: 'system_error',
          entity_type: 'error',
          entity_id: null,
          admin_user_id: error.context.userId || null,
          details: {
            error_code: error.code,
            error_message: error.message,
            severity: error.severity,
            component: error.context.component,
            action: error.context.action,
            additional_data: error.context.additionalData
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  static handleError(error: any, context: ErrorContext): StandardError {
    const standardError = this.formatError(error, context);
    this.logError(standardError);
    return standardError;
  }

  static async handleAsyncError(
    operation: () => Promise<any>,
    context: ErrorContext
  ): Promise<{ data?: any; error?: StandardError }> {
    try {
      const data = await operation();
      return { data };
    } catch (error) {
      const standardError = this.handleError(error, context);
      return { error: standardError };
    }
  }
}
