
import { REQUIRED_COLUMNS, VALID_FIRST_AID_LEVELS, VALID_CPR_LEVELS } from '../constants';

export interface RosterEntry {
  studentName: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  assessmentStatus?: string;
  length?: number;
  issueDate: string;
  courseId: string;
  matchedCourse?: {
    id: string;
    name: string;
    matchType: 'exact' | 'partial' | 'default' | 'manual';
  };
  rowIndex: number;
  hasError: boolean;
  errors?: string[];
}

export function processRosterData(
  data: Record<string, any>[],
  defaultCourseId: string,
  defaultIssueDate: string
) {
  const processedData: RosterEntry[] = [];
  let errorCount = 0;
  
  data.forEach((row, index) => {
    const entry: Partial<RosterEntry> = {
      studentName: row['Student Name']?.trim() || '',
      email: row['Email']?.trim() || '',
      phone: row['Phone']?.trim() || '',
      company: row['Company']?.trim() || '',
      city: row['City']?.trim() || '',
      province: row['Province']?.trim() || '',
      postalCode: row['Postal Code']?.trim() || '',
      firstAidLevel: row['First Aid Level']?.trim() || '',
      cprLevel: row['CPR Level']?.trim() || '',
      assessmentStatus: row['Assessment Status']?.trim() || '',
      length: row['Length'] ? parseInt(row['Length']) : undefined,
      issueDate: row['Issue Date']?.trim() || defaultIssueDate,
      courseId: defaultCourseId,
      rowIndex: index,
      hasError: false,
      errors: []
    };
    
    // Validate required fields
    if (!entry.studentName) {
      entry.hasError = true;
      entry.errors?.push('Student Name is required');
    }
    
    if (!entry.email) {
      entry.hasError = true;
      entry.errors?.push('Email is required');
    } else if (!isValidEmail(entry.email)) {
      entry.hasError = true;
      entry.errors?.push('Email format is invalid');
    }

    // Validate length if provided
    if (entry.length !== undefined) {
      if (isNaN(entry.length)) {
        entry.hasError = true;
        entry.errors?.push('Length must be a valid number');
      } else if (entry.length <= 0) {
        entry.hasError = true;
        entry.errors?.push('Length must be greater than 0');
      }
    }
    
    // Validate phone if provided
    if (entry.phone && !isValidPhoneFormat(entry.phone)) {
      entry.hasError = true;
      entry.errors?.push('Phone format should be (XXX) XXX-XXXX');
    }
    
    // Validate First Aid Level if provided
    if (entry.firstAidLevel && !VALID_FIRST_AID_LEVELS.includes(entry.firstAidLevel)) {
      entry.hasError = true;
      entry.errors?.push(`First Aid Level "${entry.firstAidLevel}" is not recognized. Valid values: ${VALID_FIRST_AID_LEVELS.filter(Boolean).join(', ')}`);
    }
    
    // Validate CPR Level if provided
    if (entry.cprLevel && !VALID_CPR_LEVELS.includes(entry.cprLevel)) {
      entry.hasError = true;
      entry.errors?.push(`CPR Level "${entry.cprLevel}" is not recognized. Valid values: ${VALID_CPR_LEVELS.filter(Boolean).join(', ')}`);
    }
    
    // Increment error count if entry has errors
    if (entry.hasError) {
      errorCount++;
    }
    
    processedData.push(entry as RosterEntry);
  });
  
  return {
    processedData,
    totalCount: data.length,
    errorCount
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhoneFormat(phone: string): boolean {
  // Accept various phone formats and normalize
  const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
  
  // Check if it's already in the correct format
  if (phoneRegex.test(phone)) {
    return true;
  }
  
  // Try to normalize common formats
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if we have 10 digits (standard US/CA number)
  return digitsOnly.length === 10;
}
