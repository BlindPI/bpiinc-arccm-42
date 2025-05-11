import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessingStatus, RowData, CourseMatch } from '../types';
import { useFileProcessor } from './useFileProcessor';
import { useCourseMatching } from './useCourseMatching';
import { useBatchSubmission } from './useBatchSubmission';

// Define the context shape
interface BatchUploadContextType {
  currentStep: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE';
  setCurrentStep: (step: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE') => void;
  selectedCourse: CourseMatch | null;
  setSelectedCourse: (course: CourseMatch | null) => void;
  isProcessingFile: boolean;
  processingStatus: ProcessingStatus | null;
  processedData: RowData[] | null;
  handleFileProcessing: (file: File) => Promise<void>;
  fileHeaders: string[];
  dataMappings: Record<string, string>;
  setDataMappings: (mappings: Record<string, string>) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  courseMatches: CourseMatch[];
  totalRowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  isSubmitting: boolean;
  submissionResults: any;
  handleSubmitBatch: () => Promise<void>;
  submissionStatus: ProcessingStatus | null;
  resetBatchUpload: () => void;
}

// Create the context with default values
const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

// Provider component
export const BatchUploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE'>('UPLOAD');
  const [selectedCourse, setSelectedCourse] = useState<CourseMatch | null>(null);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dataMappings, setDataMappings] = useState<Record<string, string>>({});
  
  // Use our custom hooks
  const {
    processFile,
    isProcessingFile,
    processingStatus,
    processedData,
    fileHeaders,
    totalRowCount,
    validRowCount,
    invalidRowCount,
    resetFileProcessor
  } = useFileProcessor();
  
  const { courseMatches } = useCourseMatching(processedData);
  
  const {
    submitBatch,
    isSubmitting,
    submissionResults,
    submissionStatus,
    resetSubmission
  } = useBatchSubmission();

  // Handler for file processing
  const handleFileProcessing = async (file: File) => {
    try {
      await processFile(file);
      setCurrentStep('REVIEW');
    } catch (error) {
      console.error('Error processing file:', error);
      // Handle error appropriately
    }
  };

  // Handler for batch submission
  const handleSubmitBatch = async () => {
    if (!selectedCourse || !processedData) {
      console.error('No course selected or processed data');
      return;
    }
    
    setCurrentStep('SUBMITTING');
    
    try {
      await submitBatch({
        data: processedData,
        courseMatch: selectedCourse,
        issueDate,
        dataMappings
      });
      
      setCurrentStep('COMPLETE');
    } catch (error) {
      console.error('Error submitting batch:', error);
      // Keep on review step when error occurs
      setCurrentStep('REVIEW');
    }
  };

  // Reset the entire batch upload process
  const resetBatchUpload = () => {
    resetFileProcessor();
    resetSubmission();
    setSelectedCourse(null);
    setCurrentStep('UPLOAD');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDataMappings({});
  };

  const value = {
    currentStep,
    setCurrentStep,
    selectedCourse,
    setSelectedCourse,
    isProcessingFile,
    processingStatus,
    processedData,
    handleFileProcessing,
    fileHeaders,
    dataMappings,
    setDataMappings,
    issueDate,
    setIssueDate,
    courseMatches,
    totalRowCount,
    validRowCount,
    invalidRowCount,
    isSubmitting,
    submissionResults,
    handleSubmitBatch,
    submissionStatus,
    resetBatchUpload
  };

  return (
    <BatchUploadContext.Provider value={value}>
      {children}
    </BatchUploadContext.Provider>
  );
};

// Custom hook for using the batch upload context
export const useBatchUpload = () => {
  const context = useContext(BatchUploadContext);
  if (context === undefined) {
    throw new Error('useBatchUpload must be used within a BatchUploadProvider');
  }
  return context;
};
