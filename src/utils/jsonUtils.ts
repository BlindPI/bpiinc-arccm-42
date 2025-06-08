
// Type-safe JSON utilities for database responses
export function safeJsonParse<T>(value: any, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'object' && value !== null) return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

export function safeJsonAccess(obj: any, key: string, defaultValue: any = null): any {
  if (!obj || typeof obj !== 'object') return defaultValue;
  return obj[key] ?? defaultValue;
}

// Type guard for checking if value is a record
export function isRecord(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
