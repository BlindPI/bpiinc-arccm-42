
import { VALID_CPR_LEVELS, VALID_FIRST_AID_LEVELS } from '../constants';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RosterEntry {
  studentName: string;
  email: string;
  phone?: string;
  company?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  assessmentStatus?: string;
  hasError: boolean;
  errors?: string[];
  rowIndex: number;
}

export function validateRosterEntry(entry: Partial<RosterEntry>, rowIndex: number): ValidationResult {
  const errors: string[] = [];

  // Required field validation
  if (!entry.studentName?.trim()) {
    errors.push('Student name is required');
  }

  // Email validation
  if (entry.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(entry.email)) {
      errors.push('Invalid email format');
    }
  }

  // Phone format validation (if provided)
  if (entry.phone) {
    const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
    if (!phoneRegex.test(entry.phone)) {
      errors.push('Phone format should be (XXX) XXX-XXXX');
    }
  }

  // First Aid Level validation
  if (entry.firstAidLevel && !VALID_FIRST_AID_LEVELS.includes(entry.firstAidLevel as any)) {
    errors.push(`Invalid First Aid Level. Must be one of: ${VALID_FIRST_AID_LEVELS.join(', ')}`);
  }

  // CPR Level validation
  if (entry.cprLevel && !VALID_CPR_LEVELS.includes(entry.cprLevel as any)) {
    errors.push(`Invalid CPR Level. Must be one of: ${VALID_CPR_LEVELS.join(', ')}`);
  }

  // Assessment Status validation
  if (entry.assessmentStatus) {
    const status = entry.assessmentStatus.toUpperCase();
    if (!['PASS', 'FAIL'].includes(status)) {
      errors.push('Assessment status must be either PASS or FAIL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function processRosterData(data: Partial<RosterEntry>[]): {
  processedData: RosterEntry[];
  totalCount: number;
  errorCount: number;
} {
  const processedData = data.map((entry, index) => {
    const validation = validateRosterEntry(entry, index);
    return {
      ...entry,
      hasError: !validation.isValid,
      errors: validation.errors,
      rowIndex: index + 1
    } as RosterEntry;
  });

  return {
    processedData,
    totalCount: processedData.length,
    errorCount: processedData.filter(entry => entry.hasError).length
  };
}
