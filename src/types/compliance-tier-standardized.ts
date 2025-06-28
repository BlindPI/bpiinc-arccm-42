
// Standardized ComplianceTierInfo interface for database alignment
export interface ComplianceTierInfo {
  id: string;
  userId: string;
  tier: 'basic' | 'robust';
  completion_percentage: number;
  can_advance_tier: boolean;
  completed_requirements: number;
  totalRequirements: number;
  requirements: string[];
  description?: string;
  next_requirement?: {
    id: string;
    name: string;
    due_date: string;
  };
  created_at: string;
  updated_at: string;
}

// Database-to-UI adapter function
export function adaptTierInfoFromDatabase(dbTierInfo: any): ComplianceTierInfo {
  return {
    id: dbTierInfo.id || '',
    userId: dbTierInfo.user_id || dbTierInfo.userId || '',
    tier: dbTierInfo.tier || 'basic',
    completion_percentage: dbTierInfo.completion_percentage || 0,
    can_advance_tier: dbTierInfo.can_advance_tier || false,
    completed_requirements: dbTierInfo.completed_requirements || 0,
    totalRequirements: dbTierInfo.total_requirements || dbTierInfo.totalRequirements || 0,
    requirements: dbTierInfo.requirements || [],
    description: dbTierInfo.description,
    next_requirement: dbTierInfo.next_requirement,
    created_at: dbTierInfo.created_at || new Date().toISOString(),
    updated_at: dbTierInfo.updated_at || new Date().toISOString()
  };
}

// JSONB casting utilities
export function safeJsonCast<T>(value: any, defaultValue: T): T {
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
