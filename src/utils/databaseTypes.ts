
import type { Json } from '@/integrations/supabase/types';

// Safe JSON parsing utilities for database types
export function safeParseJson<T = Record<string, any>>(value: Json | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as T;
  }
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed as T;
    } catch {
      return defaultValue;
    }
  }
  
  if (Array.isArray(value)) {
    return value as T;
  }
  
  return defaultValue;
}

// Safe array parsing for error logs
export function safeParseJsonArray(value: Json | null | undefined): any[] {
  if (value === null || value === undefined) return [];
  
  if (Array.isArray(value)) return value;
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  
  return [];
}

// Safe string conversion
export function safeString(value: string | null | undefined): string {
  return value || '';
}

// Safe number conversion
export function safeNumber(value: number | null | undefined): number {
  return value || 0;
}

// Safe boolean conversion
export function safeBoolean(value: boolean | null | undefined): boolean {
  return value || false;
}

// Safe date conversion
export function safeDate(value: string | null | undefined): string {
  return value || new Date().toISOString();
}

// Type guard for checking if value is a record
export function isRecord(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
