
// Helper function to safely parse JSONB objects
export function parseJsonObject(value: any): Record<string, any> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

// Helper function to safely cast status
export function parseTeamStatus(status: any): 'active' | 'inactive' | 'suspended' {
  if (typeof status === 'string' && ['active', 'inactive', 'suspended'].includes(status)) {
    return status as 'active' | 'inactive' | 'suspended';
  }
  return 'active';
}

// Helper function to safely cast assignment type
export function parseAssignmentType(type: any): 'primary' | 'secondary' | 'temporary' {
  if (typeof type === 'string' && ['primary', 'secondary', 'temporary'].includes(type)) {
    return type as 'primary' | 'secondary' | 'temporary';
  }
  return 'primary';
}
