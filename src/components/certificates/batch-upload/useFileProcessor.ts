
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { useCourseData } from '@/hooks/useCourseData';
import { processRosterFile } from '../utils/fileProcessing';
import { toast } from 'sonner';

export function useFileProcessor() {
  const { 
    setProcessedData, 
    setCurrentStep, 
    setIsProcessingFile,
    enableCourseMatching,
    selectedCourseId
  } = useBatchUpload();
  
  const { data: courses = [] } = useCourseData();

  const processFile = async (file: File) => {
    setIsProcessingFile(true);
    
    try {
      console.log('Processing file:', file.name);
      
      const processedData = await processRosterFile(
        file, 
        courses, 
        enableCourseMatching, 
        selectedCourseId
      );
      
      console.log('File processed successfully:', processedData);
      
      setProcessedData(processedData);
      setCurrentStep('REVIEW');
      
      toast.success(`File processed successfully! Found ${processedData.totalCount} records.`);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  return {
    processFile
  };
}
