
import { useState } from 'react';
import { toast } from 'sonner';
import { useCourseData } from '@/hooks/useCourseData';
import { ProcessingStatus, ProcessedDataType } from '../types';
import { useCertificationLevelsCache } from '@/hooks/useCertificationLevelsCache';
import { addMonths, format } from 'date-fns';

// Helper functions
function formatDate(dateInput: any): string {
  try {
    if (!dateInput) return '';
    
    // Handle Excel dates (numbers)
    if (typeof dateInput === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch);
      date.setDate(excelEpoch.getDate() + dateInput);
      return date.toISOString().split('T')[0];
    }
    
    // Handle string dates in various formats
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Handle Date objects
    if (dateInput instanceof Date) {
      return dateInput.toISOString().split('T')[0];
    }
    
    // Default to today if we can't parse
    return new Date().toISOString().split('T')[0];
  } catch (e) {
    console.error('Error formatting date:', e);
    return new Date().toISOString().split('T')[0];
  }
}

function addMonthsToDate(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

function determineAssessmentStatus(row: any): string {
  const assessmentField = row['assessment'] || row['Assessment'] || row['assessment_status'] || row['Assessment Status'] || row['Pass/Fail'] || '';
  
  if (!assessmentField) return 'PASS'; // Default to pass if not specified
  
  const status = String(assessmentField).trim().toUpperCase();
  
  if (status === 'FAIL' || status === 'FAILED') {
    return 'FAIL';
  } else if (status === 'PENDING' || status === 'NOT ASSESSED') {
    return 'PENDING';
  }
  
  return 'PASS'; // Default to pass for any other value
}

export function useFileProcessor() {
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedDataType | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [totalRowCount, setTotalRowCount] = useState(0);
  const [validRowCount, setValidRowCount] = useState(0);
  const [invalidRowCount, setInvalidRowCount] = useState(0);
  
  const { data: courses } = useCourseData();
  const { getAllCertificationTypes } = useCertificationLevelsCache();

  const processFile = async (file: File): Promise<ProcessedDataType | null> => {
    setIsProcessingFile(true);
    setProcessingStatus({
      processed: 0,
      successful: 0,
      failed: 0,
      total: 0,
      errors: []
    });

    try {
      // Mock implementation for now - in real usage, you would parse the file here
      // and return the processed data
      const mockProcessedData: ProcessedDataType = {
        data: [
          { 
            name: 'John Doe', 
            email: 'john@example.com',
            rowNum: 1,
            isProcessed: true,
            courseMatches: []
          },
          { 
            name: 'Jane Smith', 
            email: 'jane@example.com',
            rowNum: 2,
            isProcessed: true,
            courseMatches: []
          }
        ],
        totalCount: 2,
        errorCount: 0
      };
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessedData(mockProcessedData);
      setTotalRowCount(mockProcessedData.totalCount);
      setValidRowCount(mockProcessedData.totalCount - mockProcessedData.errorCount);
      setInvalidRowCount(mockProcessedData.errorCount);
      
      return mockProcessedData;
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsProcessingFile(false);
    }
  };

  const resetFileProcessor = () => {
    setProcessedData(null);
    setProcessingStatus(null);
    setFileHeaders([]);
    setTotalRowCount(0);
    setValidRowCount(0);
    setInvalidRowCount(0);
  };

  return { 
    processFile,
    isProcessingFile,
    processingStatus,
    processedData,
    fileHeaders,
    totalRowCount,
    validRowCount,
    invalidRowCount,
    resetFileProcessor
  };
}
