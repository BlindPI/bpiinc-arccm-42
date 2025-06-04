
import * as XLSX from 'xlsx';

const REQUIRED_COLUMNS = new Set([
  'Student Name',
  'Email', 
  'Issue Date',
  'Length'
]);

const normalizeColumnName = (name: string): string => {
  if (!name) return '';
  
  const mapping: Record<string, string> = {
    'CPR': 'CPR Level',
    'First Aid': 'First Aid Level',
    'Instructor': 'Instructor Level',
    'INSTRUCTOR': 'Instructor Level',
    'Instructor Type': 'Instructor Level',
    'Length': 'Length',
    'Hours': 'Length',
    'Course Hours': 'Length',
    'Issue Date': 'Issue Date',
    'Completion Date': 'Issue Date',
    'Student Name': 'Student Name',
    'Name': 'Student Name',
    'Recipient': 'Student Name',
    'Email': 'Email',
    'E-mail': 'Email',
    'Instructor Name': 'Instructor'
  };
  
  return mapping[name] || name;
};

export const processExcelFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const rawHeaders = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })[0];
  const normalizedHeaders = rawHeaders.map(normalizeColumnName);
  
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

  const courseInfo = {
    firstAidLevel: firstRow['First Aid Level'] || undefined,
    cprLevel: firstRow['CPR Level'] || undefined,
    instructorLevel: firstRow['Instructor Level'] || undefined,
    length: firstRow['Length'] ? parseInt(firstRow['Length']) : undefined,
    assessmentStatus: firstRow['Pass/Fail'] || undefined,
    issueDate: issueDate,
    instructorName: firstRow['Instructor'] || undefined
  };
  
  return { issueDate, courseInfo };
}
