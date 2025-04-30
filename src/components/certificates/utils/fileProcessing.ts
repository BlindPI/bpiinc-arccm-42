
import * as XLSX from 'xlsx';

export const processExcelFile = async (file: File): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        console.log('Processed Excel rows:', rows);
        resolve(rows as Record<string, any>[]);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
};

export const extractDataFromFile = (data: Record<string, any>[]): any => {
  // Initialize variables to store extracted info
  let courseInfo: any = null;
  let issueDate: string | null = null;
  let instructor: string | null = null;
  
  // Function to check headers for course info
  const findCourseInfo = (data: any[]): void => {
    if (!data || data.length === 0) return;
    
    // Look for headers that might contain course info
    const headers = Object.keys(data[0]);
    
    // Look for first aid level and CPR level headers
    const firstAidHeaders = ['First Aid Level', 'FA Level', 'First Aid', 'FA Type'];
    const cprHeaders = ['CPR Level', 'CPR', 'CPR Type'];
    const lengthHeaders = ['Length', 'Hours', 'Course Length', 'Duration'];
    const instructorHeaders = ['Instructor', 'Instructor Name', 'Teacher', 'Taught By'];
    
    let firstAidLevel = '';
    let cprLevel = '';
    let length = 0;
    
    // Check if we have consistent values across all rows for course info
    if (data.length > 1) {
      // Find first aid level
      for (const header of firstAidHeaders) {
        if (headers.includes(header) && data[0][header]) {
          const uniqueValues = new Set(data.map(row => row[header]).filter(Boolean));
          if (uniqueValues.size === 1) {
            firstAidLevel = data[0][header];
            break;
          }
        }
      }
      
      // Find CPR level
      for (const header of cprHeaders) {
        if (headers.includes(header) && data[0][header]) {
          const uniqueValues = new Set(data.map(row => row[header]).filter(Boolean));
          if (uniqueValues.size === 1) {
            cprLevel = data[0][header];
            break;
          }
        }
      }
      
      // Find length
      for (const header of lengthHeaders) {
        if (headers.includes(header) && data[0][header]) {
          const uniqueValues = new Set(data.map(row => row[header]).filter(Boolean));
          if (uniqueValues.size === 1) {
            length = parseFloat(data[0][header]) || 0;
            break;
          }
        }
      }
    }
    
    // Look for instructor information
    for (const header of instructorHeaders) {
      if (headers.includes(header) && data[0][header]) {
        const uniqueValues = new Set(data.map(row => row[header]).filter(Boolean));
        if (uniqueValues.size === 1) {
          instructor = data[0][header];
          break;
        }
      }
    }
    
    // Set courseInfo if we found any info
    if (firstAidLevel || cprLevel || length > 0) {
      courseInfo = {
        firstAidLevel,
        cprLevel,
        length
      };
    }
  };
  
  // Function to check for issue date
  const findIssueDate = (data: any[]): void => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const issueDateHeaders = ['Issue Date', 'Date', 'Course Date', 'Completion Date'];
    
    for (const header of issueDateHeaders) {
      if (headers.includes(header) && data[0][header]) {
        const uniqueValues = new Set(data.map(row => row[header]).filter(Boolean));
        if (uniqueValues.size === 1) {
          issueDate = data[0][header];
          break;
        }
      }
    }
  };
  
  // Extract course info and issue date
  findCourseInfo(data);
  findIssueDate(data);
  
  return {
    courseInfo,
    issueDate,
    instructor
  };
};

export const processCSVFile = async (file: File): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        resolve(rows);
      } catch (error) {
        console.error('Error processing CSV file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
    
    reader.readAsText(file);
  });
};

const parseCSV = (csvText: string): Record<string, any>[] => {
  // Basic CSV parser - can be replaced with a more robust library
  const lines = csvText.split(/\r\n|\n/);
  const headers = lines[0].split(',').map(header => header.trim());
  const results: Record<string, any>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const currentLine = lines[i].split(',');
    const obj: Record<string, any> = {};
    
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j]?.trim() || '';
    }
    
    results.push(obj);
  }
  
  return results;
};
