import * as XLSX from 'xlsx';

export function processExcelFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData as Record<string, any>[]);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

export function extractDataFromFile(data: Record<string, any>[]) {
  if (!data || data.length === 0) {
    return {
      courseInfo: null,
      issueDate: null,
      locationInfo: null
    };
  }

  // Extract course information from the first row or common patterns
  const firstRow = data[0];
  
  return {
    courseInfo: {
      firstAidLevel: firstRow['First Aid Level'] || '',
      cprLevel: firstRow['CPR Level'] || '',
      length: parseFloat(firstRow['Length']?.toString() || '0') || 0
    },
    issueDate: firstRow['Issue Date'] || new Date().toISOString().split('T')[0],
    locationInfo: {
      city: firstRow['City'] || '',
      province: firstRow['Province'] || '',
      postalCode: firstRow['Postal Code'] || ''
    }
  };
}