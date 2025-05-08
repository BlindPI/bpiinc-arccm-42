
import * as XLSX from 'xlsx';
import { REQUIRED_COLUMNS } from '../constants';

const normalizeColumnName = (name: string): string => {
  if (!name) return '';
  
  const mapping: Record<string, string> = {
    'CPR': 'CPR Level',
    'First Aid': 'First Aid Level',
    'Instructor': 'Instructor Level',
    'INSTRUCTOR': 'Instructor Level',
    'Instructor Type': 'Instructor Level',
    'Instructor Certification': 'Instructor Level',
    'Length': 'Length',
    'Hours': 'Length',
    'Course Hours': 'Length',
    'course_length': 'Length',
    'Course Length': 'Length',
    'Issue Date': 'Issue Date',
    'Completion Date': 'Issue Date',
    'ISSUE': 'Issue Date',
    'Date': 'Issue Date',
    'Student Name': 'Student Name',
    'Name': 'Student Name',
    'Recipient': 'Student Name',
    'Recipient Name': 'Student Name',
    'recipient_name': 'Student Name',
    'Email': 'Email',
    'E-mail': 'Email',
    'EmailAddress': 'Email',
    'email': 'Email',
    'Instructor Name': 'Instructor'
  };
  
  return mapping[name] || name;
};

const normalizeCprLevel = (cprLevel: string): string => {
  if (!cprLevel) return '';
  
  const withoutMonths = cprLevel.replace(/\s+\d+m\b/gi, '');
  
  return withoutMonths.replace('w/AED', '& AED')
                      .replace('w/ AED', '& AED')
                      .trim();
};

const normalizeInstructorLevel = (instructorLevel: string): string => {
  if (!instructorLevel) return '';
  
  // Standardize common variations
  let normalized = instructorLevel
    .replace(/\bINSTRUCTOR\b\s*:/i, 'INSTRUCTOR:')
    .replace(/\bINSTR\b\s*:/i, 'INSTRUCTOR:')
    .replace(/\bINST\b\s*:/i, 'INSTRUCTOR:')
    .trim();
  
  // If it doesn't start with INSTRUCTOR: and looks like an instructor certification,
  // add the prefix
  if (!normalized.toUpperCase().startsWith('INSTRUCTOR:') && 
      (normalized.toUpperCase().includes('INSTRUCTOR') || 
       normalized.toUpperCase().includes('TRAINER'))) {
    normalized = 'INSTRUCTOR: ' + normalized;
  }
  
  return normalized;
};

/**
 * Detects and extracts instructor information from first aid level field
 * @param firstAidLevel The first aid level string that might contain instructor info
 * @returns Object with separated firstAidLevel and instructorLevel
 */
export const extractInstructorInfoFromFirstAid = (firstAidLevel: string): { 
  firstAidLevel: string; 
  instructorLevel: string | null;
} => {
  if (!firstAidLevel) {
    return { firstAidLevel: '', instructorLevel: null };
  }
  
  // Check for instructor prefix patterns
  if (firstAidLevel.toUpperCase().includes('INSTRUCTOR:')) {
    const parts = firstAidLevel.split('INSTRUCTOR:');
    // If there's content before "INSTRUCTOR:", it might be the actual first aid level
    const actualFirstAidLevel = parts[0].trim();
    // The part after "INSTRUCTOR:" is the instructor certification
    const instructorInfo = 'INSTRUCTOR: ' + parts[1].trim();
    
    console.log('Extracted instructor info from first aid field:', { 
      original: firstAidLevel, 
      firstAidLevel: actualFirstAidLevel || null, 
      instructorLevel: instructorInfo 
    });
    
    return { 
      firstAidLevel: actualFirstAidLevel || '', 
      instructorLevel: instructorInfo 
    };
  } 
  // Check for other instructor patterns
  else if (firstAidLevel.toUpperCase().includes('INSTRUCTOR') && 
           !firstAidLevel.toUpperCase().includes('EMERGENCY FIRST AID')) {
    console.log('Detected instructor info without prefix:', firstAidLevel);
    return { 
      firstAidLevel: '', 
      instructorLevel: normalizeInstructorLevel(firstAidLevel) 
    };
  }
  
  return { firstAidLevel, instructorLevel: null };
}

export const processExcelFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const rawHeaders = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })[0];
  const normalizedHeaders = rawHeaders.map(normalizeColumnName);
  
  console.log('Original headers:', rawHeaders);
  console.log('Normalized headers:', normalizedHeaders);
  
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
    raw: false,
    defval: ''
  });

  return rows.map(row => {
    const cleanedRow: Record<string, any> = {};
    
    for (const originalKey of Object.keys(row)) {
      const normalizedKey = normalizeColumnName(originalKey);
      let value = row[originalKey]?.toString().trim() || '';
      
      if (normalizedKey === 'Length' && value) {
        const numValue = parseFloat(value);
        value = isNaN(numValue) ? '' : numValue.toString();
      }
      
      if (normalizedKey === 'Issue Date' && value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.log('Failed to parse date:', value);
        }
      }
      
      if (normalizedKey === 'CPR Level' && value) {
        value = normalizeCprLevel(value);
      }
      
      if (normalizedKey === 'First Aid Level' && value) {
        // Process first aid level and check for instructor info
        const extracted = extractInstructorInfoFromFirstAid(value);
        value = extracted.firstAidLevel;
        
        // If instructor info was found in the first aid field, set it in the Instructor Level field
        if (extracted.instructorLevel) {
          cleanedRow['Instructor Level'] = extracted.instructorLevel;
        }
      }
      
      if (normalizedKey === 'Instructor Level' && value) {
        value = normalizeInstructorLevel(value);
      }
      
      if (normalizedKey === 'Instructor') {
        value = value.trim();
      }
      
      // Ensure we're mapping student name consistently
      if (normalizedKey === 'Student Name') {
        cleanedRow['Student Name'] = value;
      } else {
        cleanedRow[normalizedKey] = value;
      }
    }
    
    return cleanedRow;
  });
};

export const processCSVFile = async (file: File) => {
  const text = await file.text();
  const rows = text.split('\n').map(row => row.trim()).filter(Boolean);
  const headers = rows[0].split(',').map(header => header.trim());
  const normalizedHeaders = headers.map(normalizeColumnName);
  
  console.log('CSV Original headers:', headers);
  console.log('CSV Normalized headers:', normalizedHeaders);
  
  const missingColumns = Array.from(REQUIRED_COLUMNS).filter(col => !normalizedHeaders.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return rows.slice(1).map(row => {
    const values = row.split(',').map(cell => cell.trim());
    const rowData: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      const normalizedHeader = normalizeColumnName(header);
      let value = values[index] || '';
      
      if (normalizedHeader === 'Length' && value) {
        const numValue = parseFloat(value);
        value = isNaN(numValue) ? '' : numValue.toString();
      }
      
      if (normalizedHeader === 'Issue Date' && value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.log('Failed to parse date:', value);
        }
      }
      
      if (normalizedHeader === 'CPR Level' && value) {
        value = normalizeCprLevel(value);
      }
      
      if (normalizedHeader === 'First Aid Level' && value) {
        // Process first aid level and check for instructor info
        const extracted = extractInstructorInfoFromFirstAid(value);
        value = extracted.firstAidLevel;
        
        // If instructor info was found in the first aid field, set it in the Instructor Level field
        if (extracted.instructorLevel) {
          rowData['Instructor Level'] = extracted.instructorLevel;
        }
      }
      
      if (normalizedHeader === 'Instructor Level' && value) {
        value = normalizeInstructorLevel(value);
      }
      
      if (normalizedHeader === 'Instructor') {
        value = value.trim();
      }
      
      rowData[normalizedHeader] = value;
    });
    
    return rowData;
  });
};

export function extractDataFromFile(fileData: Record<string, any>[]): {
  issueDate?: string;
  courseInfo?: { 
    firstAidLevel?: string; 
    cprLevel?: string; 
    instructorLevel?: string;
    length?: number;
    assessmentStatus?: string;
    issueDate?: string;
    instructorName?: string;
  }
} {
  if (!fileData || fileData.length === 0) {
    return {};
  }
  
  const firstRow = fileData[0] || {};
  
  let issueDate: string | undefined;
  
  if (firstRow['Issue Date']) {
    const potentialDate = new Date(firstRow['Issue Date']);
    if (!isNaN(potentialDate.getTime())) {
      issueDate = potentialDate.toISOString().split('T')[0];
    }
  }

  // Process the first aid level with our new extraction logic
  let firstAidLevel = firstRow['First Aid Level'] || '';
  let instructorLevel = firstRow['Instructor Level'] || '';
  
  if (firstAidLevel) {
    const extracted = extractInstructorInfoFromFirstAid(firstAidLevel);
    // Only update if we found instructor info
    if (extracted.instructorLevel) {
      firstAidLevel = extracted.firstAidLevel;
      // If there's already an instructor level, don't overwrite it unless it's empty
      if (!instructorLevel) {
        instructorLevel = extracted.instructorLevel;
      }
    }
  }

  const courseInfo = {
    firstAidLevel,
    cprLevel: firstRow['CPR Level'],
    instructorLevel,
    length: firstRow['Length'] ? parseInt(firstRow['Length']) : undefined,
    assessmentStatus: firstRow['Pass/Fail'],
    issueDate: issueDate,
    instructorName: firstRow['Instructor']
  };
  
  console.log('Extracted data from file with enhanced parsing:', { issueDate, courseInfo });
  
  return { issueDate, courseInfo };
}
