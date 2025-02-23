
export type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';

export const ROLE_LABELS: { [key in UserRole]: string } = {
  'SA': 'System Admin',
  'AD': 'Admin',
  'AP': 'Authorized Provider',
  'IC': 'Instructor Certified',
  'IP': 'Instructor Provisional',
  'IT': 'Instructor In Training'
};

export const ROLE_HIERARCHY: { [key in UserRole]: UserRole[] } = {
  'SA': ['AD', 'AP', 'IC', 'IP', 'IT'],
  'AD': ['AP', 'IC', 'IP', 'IT'],
  'AP': ['IC', 'IP', 'IT'],
  'IC': ['IP', 'IT'],
  'IP': ['IT'],
  'IT': [],
};
