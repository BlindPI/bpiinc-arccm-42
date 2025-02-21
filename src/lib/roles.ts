
export type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';

export const ROLE_LABELS: { [key in UserRole]: string } = {
  'SA': 'System Admin',
  'AD': 'Admin',
  'AP': 'Authorized Provider',
  'IC': 'Instructor Certified',
  'IP': 'Instructor Provisional',
  'IT': 'Instructor Training'
};
