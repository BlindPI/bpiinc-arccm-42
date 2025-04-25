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

// Helper function to normalize CPR level for improved matching
const normalizeCprLevel = (cprLevel: string): string => {
  if (!cprLevel) return '';
  
  // Remove expiration months if present (e.g., "24m", "36m")
  const withoutMonths = cprLevel.replace(/\s+\d+m\b/gi, '');
  
  // Normalize w/AED to & AED
  return withoutMonths.replace('w/AED', '& AED')
                      .replace('w/ AED', '& AED')
                      .trim();
};

export function processRosterData(
  data: Record<string, any>[],
  defaultCourseId: string = '',
  defaultIssueDate: string = ''
) {
  const processedData: RosterEntry[] = [];
  let errorCount = 0;
  
  data.forEach((row, index) => {
    // Convert keys to their standard forms first
    const standardizedRow: Record<string, any> = {};
    const keyMapping: Record<string, string> = {
      'Student Name': 'Student Name',
      'NAME': 'Student Name',
      'Email': 'Email',
      'EMAIL': 'Email',
      'Phone': 'Phone',
      'PHONE': 'Phone',
      'Company': 'Company',
      'COMPANY': 'Company',
      'City': 'City',
      'CITY': 'City',
      'Province': 'Province',
      'PROVINCE': 'Province',
      'Postal Code': 'Postal Code',
      'POSTAL': 'Postal Code',
      'First Aid Level': 'First Aid Level',
      'FIRST': 'First Aid Level',
      'CPR Level': 'CPR Level',
      'CPR': 'CPR Level',
      'Assessment Status': 'Assessment Status',
      'Pass/Fail': 'Assessment Status',
      'GRADE': 'Assessment Status',
      'Length': 'Length',
      'Course Hours': 'Length',
      'HOURS': 'Length',
      'course_length': 'Length',
      'Issue Date': 'Issue Date',
      'Completion Date': 'Issue Date',
      'ISSUE': 'Issue Date',
      'Notes': 'Notes',
      'NOTES': 'Notes'
    };
    
    for (const key in row) {
      const standardKey = keyMapping[key] || key;
      standardizedRow[standardKey] = row[key];
    }
    
    console.log('Standardized row:', standardizedRow);
    
    const entry: Partial<RosterEntry> = {
      studentName: standardizedRow['Student Name']?.trim() || '',
      email: standardizedRow['Email']?.trim() || '',
      phone: standardizedRow['Phone']?.toString().trim() || '',
      company: standardizedRow['Company']?.trim() || '',
      city: standardizedRow['City']?.trim() || '',
      province: standardizedRow['Province']?.trim() || '',
      postalCode: standardizedRow['Postal Code']?.trim() || '',
      firstAidLevel: standardizedRow['First Aid Level']?.trim() || '',
      cprLevel: standardizedRow['CPR Level'] ? standardizedRow['CPR Level'].trim() : '',
      assessmentStatus: standardizedRow['Assessment Status']?.trim() || '',
      length: standardizedRow['Length'] ? parseInt(standardizedRow['Length']) : undefined,
      issueDate: standardizedRow['Issue Date']?.trim() || defaultIssueDate,
      courseId: defaultCourseId,
      rowIndex: index,
      hasError: false,
      errors: []
    };
    
    // Normalize CPR level if present
    if (entry.cprLevel) {
      entry.cprLevel = normalizeCprLevel(entry.cprLevel);
    }
    
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
    if (entry.cprLevel) {
      // First normalize the CPR level for more forgiving validation
      const normalizedCprLevel = normalizeCprLevel(entry.cprLevel);
      
      // Check if the normalized version is in the valid CPR levels
      const isValid = VALID_CPR_LEVELS.some(validLevel => {
        return normalizedCprLevel === normalizeCprLevel(validLevel);
      });
      
      if (!isValid) {
        entry.hasError = true;
        entry.errors?.push(`CPR Level "${entry.cprLevel}" is not recognized. Valid values: ${VALID_CPR_LEVELS.filter(Boolean).join(', ')}`);
      }
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
