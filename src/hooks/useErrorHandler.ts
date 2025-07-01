
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AuditLogService } from '@/services/audit/auditLogService';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToAudit?: boolean;
  fallbackMessage?: string;
}

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((
    error: unknown, 
    context?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logToAudit = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    const errorMessage = error instanceof Error ? error.message : fallbackMessage;
    const errorObj = error instanceof Error ? error : new Error(String(error));

    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    setError(errorObj);

    if (showToast) {
      toast.error(errorMessage);
    }

    if (logToAudit) {
      AuditLogService.logAction({
        action: 'ERROR_OCCURRED',
        entity_type: 'error',
        details: {
          message: errorMessage,
          context: context || 'unknown',
          stack: errorObj.stack
        }
      }).catch(console.error);
    }
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (error) {
      handleError(error, context, options);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isLoading,
    handleError,
    executeWithErrorHandling,
    clearError
  };
}
