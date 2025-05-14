
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorHandlerOptions {
  toastErrors?: boolean;
  logErrors?: boolean;
  defaultMessage?: string;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    toastErrors = true,
    logErrors = true,
    defaultMessage = "An unexpected error occurred"
  } = options;
  
  const [error, setError] = useState<Error | null>(null);
  const [isError, setIsError] = useState(false);
  
  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    const errorMessage = customMessage || errorInstance.message || defaultMessage;
    
    // Set internal error state
    setError(errorInstance);
    setIsError(true);
    
    // Optionally log the error
    if (logErrors) {
      console.error('Error caught by useErrorHandler:', errorInstance);
    }
    
    // Optionally display a toast
    if (toastErrors) {
      toast.error(errorMessage, {
        description: errorInstance.message !== errorMessage ? errorInstance.message : undefined,
      });
    }
    
    return errorInstance;
  }, [toastErrors, logErrors, defaultMessage]);
  
  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);
  
  const wrapPromise = useCallback(async <T,>(promise: Promise<T>, customMessage?: string): Promise<T> => {
    try {
      return await promise;
    } catch (err) {
      handleError(err, customMessage);
      throw err;
    }
  }, [handleError]);
  
  return {
    error,
    isError,
    handleError,
    clearError,
    wrapPromise,
  };
}
