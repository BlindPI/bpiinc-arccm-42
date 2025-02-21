
import * as XLSX from 'xlsx';
import { REQUIRED_COLUMNS } from '../constants';

export const processExcelFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
    header: REQUIRED_COLUMNS,
    raw: false,
    defval: ''
  });
  
  return rows.slice(1);
};

export const processCSVFile = async (file: File) => {
  const text = await file.text();
  const rows = text.split('\n');
  const headers = rows[0].split(',').map(header => header.trim());
  
  const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return rows.slice(1).map(row => {
    const values = row.split(',').map(cell => cell.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
};
