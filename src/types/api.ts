
export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export type ComplianceData = any; // This would be expanded with proper types
export type TeachingData = any; // This would be expanded with proper types
export type DocumentRequirement = any; // This would be expanded with proper types
