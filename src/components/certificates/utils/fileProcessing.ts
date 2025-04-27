
import * as XLSX from 'xlsx';
import { REQUIRED_COLUMNS } from '../constants';

const normalizeColumnName = (name: string): string => {
  const mapping: Record<string, string> = {
    'CPR': 'CPR Level',
    'CPR Level': 'CPR Level',
    'First Aid': 'First Aid Level',
    'First Aid Level': 'First Aid Level',
    'Length': 'Length',
    'Hours': 'Length',
    'Course Hours': 'Length',
    'course_length': 'Length',
    'Course Length': 'Length',
    'Issue Date': 'Issue Date',
    'Completion Date': 'Issue Date',
    'ISSUE': 'Issue Date',
    'Date': 'Issue Date',
    'Instructor': 'Instructor',
    'INSTRUCTOR': 'Instructor',
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
      
      if (normalizedKey === 'Instructor') {
        value = value.trim();
      }
      
      cleanedRow[normalizedKey] = value;
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
    length?: number;
    assessmentStatus?: string;
    issueDate?: string;
    instructorName?: string;  // Added instructorName here
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

  const courseInfo = {
    firstAidLevel: firstRow['First Aid Level'],
    cprLevel: firstRow['CPR Level'],
    length: firstRow['Length'] ? parseInt(firstRow['Length']) : undefined,
    assessmentStatus: firstRow['Pass/Fail'],
    issueDate: issueDate,
    instructorName: firstRow['Instructor']  // Added instructor name extraction
  };
  
  console.log('Extracted data from file:', { issueDate, courseInfo });
  
  return { issueDate, courseInfo };
}
