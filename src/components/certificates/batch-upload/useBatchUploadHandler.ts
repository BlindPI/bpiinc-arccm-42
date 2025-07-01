
import { useState } from 'react';
import { processRosterFile } from '../utils/fileProcessing';
import { useCourseData } from '@/hooks/useCourseData';
import type { ProcessedData } from '@/types/batch-upload';

export function useBatchUploadHandler() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const { data: courses = [] } = useCourseData();

  const handleFileUpload = async (
    file: File, 
    enableCourseMatching: boolean = false, 
    selectedCourseId?: string
  ): Promise<ProcessedData> => {
    setIsProcessing(true);
    
    try {
      console.log('Starting file upload processing...');
      
      const result = await processRosterFile(
        file, 
        courses, 
        enableCourseMatching, 
        selectedCourseId
      );
      
      setProcessedData(result);
      return result;
      
    } catch (error) {
      console.error('Error in batch upload handler:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleFileUpload,
    isProcessing,
    processedData
  };
}
