import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessingStatus, RowData, CourseMatch, ExtractedCourseInfo, ProcessedDataType } from '../types';
import { useFileProcessor } from './useFileProcessor';
import { useCourseMatching, UseCourseMatchingResult } from './useCourseMatching';
import { useBatchSubmission } from './useBatchSubmission';
import { BatchSubmissionResult } from '@/types/batch-upload';

// Define the context shape
interface BatchUploadContextType {
  currentStep: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE';
  setCurrentStep: (step: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE') => void;
  selectedCourseId: string;
  setSelectedCourseId: (course: string) => void;
  isProcessingFile: boolean;
  processingStatus: ProcessingStatus | null;
  processedData: ProcessedDataType | null;
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
  submissionResult: BatchSubmissionResult | null;
  handleSubmitBatch: () => Promise<void>;
  resetBatchUpload: () => void;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enable: boolean) => void;
  extractedCourse: ExtractedCourseInfo | null;
  setExtractedCourse: (course: ExtractedCourseInfo | null) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (hasMatches: boolean) => void;
  batchName: string;
  setBatchName: (name: string) => void;
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  isValidated: boolean;
  setIsValidated: (validated: boolean) => void;
}

// Create the context with default values
const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

// Provider component
export const BatchUploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE'>('UPLOAD');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('none');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dataMappings, setDataMappings] = useState<Record<string, string>>({});
  const [enableCourseMatching, setEnableCourseMatching] = useState<boolean>(true);
  const [extractedCourse, setExtractedCourse] = useState<ExtractedCourseInfo | null>(null);
  const [hasCourseMatches, setHasCourseMatches] = useState<boolean>(false);
  const [batchName, setBatchName] = useState<string>(`Batch ${new Date().toISOString().split('T')[0]}`);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('none');
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Use our custom hooks
  const fileProcessor = useFileProcessor();
  const { courseMatches } = useCourseMatching(fileProcessor.processedData?.data || null);
  const batchSubmission = useBatchSubmission();
  
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedDataType | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [totalRowCount, setTotalRowCount] = useState<number>(0);
  const [validRowCount, setValidRowCount] = useState<number>(0);
  const [invalidRowCount, setInvalidRowCount] = useState<number>(0);
  
  // Handler for file processing
  const handleFileProcessing = async (file: File) => {
    setIsProcessingFile(true);
    try {
      const result = await fileProcessor.processFile(file);
      if (result) {
        setProcessedData(result);
        setCurrentStep('REVIEW');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      // Handle error appropriately
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handler for batch submission
  const handleSubmitBatch = async () => {
    if (!selectedCourseId || !processedData) {
      console.error('No course selected or processed data');
      return;
    }
    
    setCurrentStep('SUBMITTING');
    
    try {
      const result = await batchSubmission.submitBatch();
      setCurrentStep('COMPLETE');
    } catch (error) {
      console.error('Error submitting batch:', error);
      // Keep on review step when error occurs
      setCurrentStep('REVIEW');
    }
  };

  // Reset the entire batch upload process
  const resetBatchUpload = () => {
    setProcessedData(null);
    setProcessingStatus(null);
    setSelectedCourseId('none');
    setCurrentStep('UPLOAD');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDataMappings({});
    setBatchName(`Batch ${new Date().toISOString().split('T')[0]}`);
    setSelectedLocationId('none');
    setIsValidated(false);
  };

  const value = {
    currentStep,
    setCurrentStep,
    selectedCourseId,
    setSelectedCourseId,
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
    isSubmitting: batchSubmission.isSubmitting,
    submissionResult: batchSubmission.submissionResult,
    handleSubmitBatch,
    resetBatchUpload,
    enableCourseMatching,
    setEnableCourseMatching,
    extractedCourse,
    setExtractedCourse,
    hasCourseMatches,
    setHasCourseMatches,
    batchName,
    setBatchName,
    selectedLocationId,
    setSelectedLocationId,
    isValidated,
    setIsValidated
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
