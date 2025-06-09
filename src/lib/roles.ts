
export type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT' | 'IN' | 'TL' | 'ST';

export const ROLE_LABELS: Record<UserRole, string> = {
  SA: 'System Admin',
  AD: 'Administrator',
  AP: 'Authorized Provider',
  IC: 'Certified Instructor',
  IP: 'Provisional Instructor',
  IT: 'Instructor Trainee',
  IN: 'Student/Participant',
  TL: 'Team Leader',
  ST: 'Student'
};

export const ROLE_HIERARCHY: { [key in UserRole]: UserRole[] } = {
  'SA': ['AD', 'AP', 'IC', 'IP', 'IT', 'IN', 'TL', 'ST'],
  'AD': ['AP', 'IC', 'IP', 'IT', 'IN', 'TL', 'ST'],
  'AP': ['IC', 'IP', 'IT', 'IN', 'ST'],
  'IC': ['IP', 'IT', 'IN', 'ST'],
  'IP': ['IT', 'IN', 'ST'],
  'IT': ['IN', 'ST'],
  'IN': ['ST'],
  'TL': ['ST'],
  'ST': [],
};
