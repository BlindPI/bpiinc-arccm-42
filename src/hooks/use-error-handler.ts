
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

type ErrorWithMessage = {
  message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;
  
  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // Fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

export function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

interface UseErrorHandlerOptions {
  toastOnError?: boolean;
  logToConsole?: boolean;
  captureError?: (error: unknown) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  
  const { 
    toastOnError = true, 
    logToConsole = true,
    captureError
  } = options;
  
  const handleError = (err: unknown) => {
    const errorMessage = getErrorMessage(err);
    const errorObject = err instanceof Error ? err : new Error(errorMessage);
    
    setError(errorObject);
    
    if (logToConsole) {
      console.error('Error caught by useErrorHandler:', errorObject);
    }
    
    if (toastOnError) {
      toast({
        title: "An error occurred",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    // If a custom error capture function is provided (like for analytics)
    if (captureError) {
      captureError(errorObject);
    }
    
    return errorObject;
  };
  
  const clearError = () => setError(null);
  
  return {
    error,
    handleError,
    clearError,
    isError: error !== null
  };
}

// A modified version of React Query's onError handler
export function useQueryErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { handleError } = useErrorHandler(options);
  
  return {
    onError: (error: unknown) => {
      handleError(error);
    }
  };
}
