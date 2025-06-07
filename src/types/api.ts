
import type { Database } from '@/types/supabase-schema';

// Export the course offering type from the database schema
export type CourseOffering = Database['public']['Tables']['course_offerings']['Row'];

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Common API error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
