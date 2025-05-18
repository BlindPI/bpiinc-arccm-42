
export type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT' | 'IN';

export const ROLE_LABELS: { [key in UserRole]: string } = {
  'SA': 'System Admin',
  'AD': 'Admin',
  'AP': 'Authorized Provider',
  'IC': 'Instructor Certified',
  'IP': 'Instructor Provisional',
  'IT': 'Instructor In Training',
  'IN': 'Instructor New'
};

export const ROLE_HIERARCHY: { [key in UserRole]: UserRole[] } = {
  'SA': ['AD', 'AP', 'IC', 'IP', 'IT', 'IN'],
  'AD': ['AP', 'IC', 'IP', 'IT', 'IN'],
  'AP': ['IC', 'IP', 'IT', 'IN'],
  'IC': ['IP', 'IT', 'IN'],
  'IP': ['IT', 'IN'],
  'IT': ['IN'],
  'IN': [],
};
