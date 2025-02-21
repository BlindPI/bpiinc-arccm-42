
import * as XLSX from 'xlsx';
import { REQUIRED_COLUMNS } from '../constants';

export const processExcelFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
    header: Array.from(REQUIRED_COLUMNS),
    raw: false,
    defval: ''
  });

  // Clean and standardize the data
  return rows.slice(1).map(row => {
    const cleanedRow: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      cleanedRow[key] = row[key]?.toString().trim() || '';
    }
    return cleanedRow;
  });
};

export const processCSVFile = async (file: File) => {
  const text = await file.text();
  const rows = text.split('\n').map(row => row.trim()).filter(Boolean);
  const headers = rows[0].split(',').map(header => header.trim());
  
  const missingColumns = Array.from(REQUIRED_COLUMNS).filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return rows.slice(1).map(row => {
    const values = row.split(',').map(cell => cell.trim());
    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });
    return rowData;
  });
};
