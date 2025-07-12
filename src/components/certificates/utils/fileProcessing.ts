import * as XLSX from 'xlsx';

export interface ProcessedRow {
  [key: string]: any;
}

export interface ExtractedData {
  totalRows: number;
  validRows: number;
  errors: string[];
}

export async function processExcelFile(file: File): Promise<ProcessedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          reject(new Error('Empty file'));
          return;
        }
        
        // Convert to object array with proper headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map((row: any[]) => {
          const obj: ProcessedRow = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        resolve(rows);
      } catch (error) {
        reject(new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

export function extractDataFromFile(processedRows: ProcessedRow[]): ExtractedData {
  const errors: string[] = [];
  let validRows = 0;
  
  processedRows.forEach((row, index) => {
    // Basic validation - check if required fields exist
    const requiredFields = ['recipient_name', 'course_name', 'issue_date', 'expiry_date'];
    const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');
    
    if (missingFields.length === 0) {
      validRows++;
    } else {
      errors.push(`Row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`);
    }
  });
  
  return {
    totalRows: processedRows.length,
    validRows,
    errors
  };
}

export interface ProcessedData {
  data: ProcessedRow[];
  totalCount: number;
  errorCount: number;
}

export async function processRosterFile(
  file: File, 
  courses: any[] = [], 
  enableCourseMatching: boolean = false, 
  selectedCourseId?: string
): Promise<ProcessedData> {
  const processedRows = await processExcelFile(file);
  const extractedData = extractDataFromFile(processedRows);
  
  return {
    data: processedRows,
    totalCount: extractedData.totalRows,
    errorCount: extractedData.totalRows - extractedData.validRows
  };
}