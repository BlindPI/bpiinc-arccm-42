
import { toast } from 'sonner';

interface ErrorOptions {
  context?: string;
  fallbackMessage?: string;
  showToast?: boolean;
  logToConsole?: boolean;
}

/**
 * A unified error handler to consistently manage and display errors
 */
export function handleError(error: unknown, options: ErrorOptions = {}): string {
  const {
    context = 'Operation',
    fallbackMessage = 'An unexpected error occurred',
    showToast = true,
    logToConsole = true
  } = options;

  // Extract error message based on error type
  let errorMessage = fallbackMessage;
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && error !== null) {
    // Try to extract error message from various API error formats
    if ('message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    } else if ('error' in error && typeof error.error === 'string') {
      errorMessage = error.error;
    } else if ('errorMessage' in error && typeof error.errorMessage === 'string') {
      errorMessage = error.errorMessage;
    }
  }

  // Format the error message with context
  const formattedMessage = `${context} failed: ${errorMessage}`;
  
  // Log to console if enabled
  if (logToConsole) {
    console.error(`Error in ${context}:`, error);
  }
  
  // Show toast notification if enabled
  if (showToast) {
    toast.error(formattedMessage);
  }
  
  return formattedMessage;
}

/**
 * Type guard to check if an object has an error property
 */
export function hasErrorProperty(obj: unknown): obj is { error: unknown } {
  return typeof obj === 'object' && obj !== null && 'error' in obj;
}
