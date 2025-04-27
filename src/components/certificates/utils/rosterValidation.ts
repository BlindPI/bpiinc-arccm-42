import { CourseMatch } from '../types';

export interface RosterEntry {
  rowIndex: number;
  studentName: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  instructorName?: string;
  length?: string | number;
  assessmentStatus?: 'PASS' | 'FAIL';
  hasError?: boolean;
  errors?: string[];
  courseId?: string;
  matchedCourse?: CourseMatch;
  issueDate?: string;
  expiryDate?: string;
}
