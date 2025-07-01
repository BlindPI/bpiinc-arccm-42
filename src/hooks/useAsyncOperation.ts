
import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';

export function useAsyncOperation<T = any>() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const { error, handleError, clearError } = useErrorHandler();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      context?: string;
    }
  ) => {
    try {
      setIsLoading(true);
      clearError();
      
      const result = await operation();
      setData(result);
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      handleError(error, options?.context);
      
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const reset = useCallback(() => {
    setData(null);
    clearError();
    setIsLoading(false);
  }, [clearError]);

  return {
    isLoading,
    data,
    error,
    execute,
    reset
  };
}
