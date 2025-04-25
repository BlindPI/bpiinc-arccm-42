
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
  city?: string;
  province?: string;
  postalCode?: string;
  completionDate?: string;
  hasError: boolean;
  errors?: string[];
  rowIndex: number;
}

/**
 * Normalizes a phone number by removing all non-digit characters
 * and then formatting it to (XXX) XXX-XXXX if it has 10 digits
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If we have exactly 10 digits, format as (XXX) XXX-XXXX
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.substring(0, 3)}) ${digitsOnly.substring(3, 6)}-${digitsOnly.substring(6)}`;
  }
  
  // Return original if we don't have 10 digits (will be caught by validation)
  return phone;
}

/**
 * Validates a phone number format
 * Accepts many input formats but requires 10 digits total
 */
function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Phone is optional
  
  // Remove all non-digit characters and check if we have 10 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
}

export function validateRosterEntry(entry: Partial<RosterEntry>, rowIndex: number): ValidationResult {
  const errors: string[] = [];

  // Required field validation - only student name and email are required
  if (!entry.studentName?.trim()) {
    errors.push('Student name is required');
  }

  if (!entry.email?.trim()) {
    errors.push('Email is required');
  } else {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(entry.email)) {
      errors.push('Invalid email format');
    }
  }

  // Phone format validation (if provided)
  if (entry.phone) {
    if (!isValidPhone(entry.phone)) {
      errors.push('Phone number must contain 10 digits');
    }
  }

  // Add postal code validation if provided
  if (entry.postalCode?.trim()) {
    // Canadian postal code format: A1A 1A1
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/i;
    if (!postalCodeRegex.test(entry.postalCode)) {
      errors.push('Invalid postal code format. Use format: A1A 1A1');
    }
  }

  // First Aid Level validation if provided
  if (entry.firstAidLevel && !VALID_FIRST_AID_LEVELS.includes(entry.firstAidLevel as any)) {
    errors.push(`Invalid First Aid Level. Must be one of: ${VALID_FIRST_AID_LEVELS.join(', ')}`);
  }

  // CPR Level validation if provided
  if (entry.cprLevel && !VALID_CPR_LEVELS.includes(entry.cprLevel as any)) {
    errors.push(`Invalid CPR Level. Must be one of: ${VALID_CPR_LEVELS.join(', ')}`);
  }

  // Assessment Status validation if provided
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
  console.log('Processing roster data:', data);
  
  if (!data || data.length === 0) {
    console.log('No data to process');
    return {
      processedData: [],
      totalCount: 0,
      errorCount: 0
    };
  }
  
  // Pre-process phone numbers to normalize the format
  const normalizedData = data.map(entry => {
    if (entry.phone) {
      return {
        ...entry,
        phone: normalizePhoneNumber(entry.phone)
      };
    }
    return entry;
  });

  // Validate the normalized data
  const processedData = normalizedData.map((entry, index) => {
    const validation = validateRosterEntry(entry, index + 1);
    return {
      ...entry,
      studentName: entry.studentName || '',
      email: entry.email || '',
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
