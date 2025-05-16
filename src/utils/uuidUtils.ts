/**
 * Generates a UUID (v4) that works across different environments
 * Falls back to a simple implementation if crypto.randomUUID is not available
 */
export function generateUUID(): string {
  // Try to use the standard crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}