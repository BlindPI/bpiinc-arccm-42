/**
 * Production-safe debug utilities
 * Replaces console.log statements with conditional logging
 */

/**
 * Debug logging that only outputs in development mode
 */
export const debugLog = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

/**
 * Warning logging that only outputs in development mode
 */
export const debugWarn = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.warn(`[DEBUG] ${message}`, ...args);
  }
};

/**
 * Error logging that outputs in all modes but with different levels
 */
export const debugError = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.error(`[DEBUG] ${message}`, ...args);
  } else {
    // In production, log errors but without sensitive details
    console.error(`Application error: ${message}`);
  }
};

/**
 * Performance timing utility for development
 */
export const debugTime = (label: string) => {
  if (import.meta.env.DEV) {
    console.time(`[DEBUG] ${label}`);
  }
};

export const debugTimeEnd = (label: string) => {
  if (import.meta.env.DEV) {
    console.timeEnd(`[DEBUG] ${label}`);
  }
};

/**
 * Conditional debug wrapper for complex debugging
 */
export const withDebug = <T>(fn: () => T, debugInfo?: string): T => {
  if (import.meta.env.DEV && debugInfo) {
    debugLog(debugInfo);
  }
  return fn();
};

/**
 * Safe JSON stringify for debugging
 */
export const debugStringify = (obj: any): string => {
  if (!import.meta.env.DEV) return '';
  
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return '[Circular or non-serializable object]';
  }
};