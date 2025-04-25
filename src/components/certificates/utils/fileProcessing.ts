
import * as XLSX from 'xlsx';
import { REQUIRED_COLUMNS } from '../constants';

export const processExcelFile = async (file: File) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // First, get all the data from the Excel file
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
      raw: false,
      defval: ''
    });
    
    console.log('Raw Excel data:', rawData);
    
    // Map the Excel column names to our expected column names
    const mappedData = rawData.map(row => {
      const mappedRow: Record<string, string> = {};
      
      // Handle standard student name
      if (row['Student Name']) {
        mappedRow.studentName = row['Student Name'].toString().trim();
      }
      
      // Handle email
      if (row['Email']) {
        mappedRow.email = row['Email'].toString().trim();
      }
      
      // Handle phone
      if (row['Phone']) {
        mappedRow.phone = row['Phone'].toString().trim();
      }
      
      // Handle company
      if (row['Company']) {
        mappedRow.company = row['Company'].toString().trim();
      }
      
      // Handle city
      if (row['City']) {
        mappedRow.city = row['City'].toString().trim();
      }
      
      // Handle province
      if (row['Province']) {
        mappedRow.province = row['Province'].toString().trim();
      }
      
      // Handle postal code
      if (row['Postal Code']) {
        mappedRow.postalCode = row['Postal Code'].toString().trim();
      }
      
      // Handle first aid level
      if (row['First Aid Level']) {
        mappedRow.firstAidLevel = row['First Aid Level'].toString().trim();
      }
      
      // Handle CPR level
      if (row['CPR Level']) {
        mappedRow.cprLevel = row['CPR Level'].toString().trim();
      }
      
      // Handle assessment status (Pass/Fail)
      if (row['Pass/Fail']) {
        mappedRow.assessmentStatus = row['Pass/Fail'].toString().trim();
      }
      
      // Handle the completion date if present
      if (row['Completion Date']) {
        mappedRow.completionDate = row['Completion Date'].toString().trim();
      }

      return mappedRow;
    });
    
    console.log('Mapped Excel data:', mappedData);
    return mappedData;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw new Error(`Error processing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const processCSVFile = async (file: File) => {
  try {
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Get the headers from the first line
    const headers = lines[0].split(',').map(header => header.trim());
    console.log('CSV headers:', headers);
    
    // Map each row to an object with column headers as keys
    const mappedData = lines.slice(1).map(line => {
      const values = line.split(',').map(cell => cell.trim());
      const rowData: Record<string, string> = {};
      
      // Map the CSV values to our expected column names
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Map the header to our expected field names
        switch (header) {
          case 'Student Name':
            rowData.studentName = value;
            break;
          case 'Email':
            rowData.email = value;
            break;
          case 'Phone':
            rowData.phone = value;
            break;
          case 'Company':
            rowData.company = value;
            break;
          case 'City':
            rowData.city = value;
            break;
          case 'Province':
            rowData.province = value;
            break;
          case 'Postal Code':
            rowData.postalCode = value;
            break;
          case 'First Aid Level':
            rowData.firstAidLevel = value;
            break;
          case 'CPR Level':
            rowData.cprLevel = value;
            break;
          case 'Pass/Fail':
            rowData.assessmentStatus = value;
            break;
          case 'Completion Date':
            rowData.completionDate = value;
            break;
          default:
            // For any other columns, store them with their original header name
            rowData[header] = value;
        }
      });
      
      return rowData;
    });
    
    console.log('Mapped CSV data:', mappedData);
    return mappedData;
  } catch (error) {
    console.error('Error processing CSV file:', error);
    throw new Error(`Error processing CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

