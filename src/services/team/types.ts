
// Re-export types from main team management types file
export * from '@/types/team-management';

// Additional service-specific types
export interface TeamServiceConfig {
  enableAutoAssignment: boolean;
  enableWorkflowApprovals: boolean;
  defaultCapacity: number;
}

export interface TeamOperationResult {
  success: boolean;
  message: string;
  data?: any;
}
