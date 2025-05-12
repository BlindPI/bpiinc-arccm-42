
import { BatchUploadStep, ProcessingStatus, BatchCertificateData, ProcessedData } from '@/types/batch-upload';
import { RowData, ExtractedCourseInfo, ProcessedDataType, CourseMatch } from '../types';

// Re-export the types to maintain backward compatibility
export type { ProcessingStatus, BatchCertificateData };

// Add any additional types specific to batch upload process here
export interface BatchUploadContextType {
  currentStep: BatchUploadStep;
  setCurrentStep: (step: BatchUploadStep) => void;
  selectedCourseId: string;
  setSelectedCourseId: (courseId: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enable: boolean) => void;
  isProcessingFile: boolean;
  setIsProcessingFile: (isProcessing: boolean) => void;
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: (status: ProcessingStatus) => void;
  processedData: ProcessedDataType | null;
  setProcessedData: (data: ProcessedDataType | null) => void;
  extractedCourse: ExtractedCourseInfo | null;
  setExtractedCourse: (course: ExtractedCourseInfo | null) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (has: boolean) => void;
  batchName: string;
  setBatchName: (name: string) => void;
  resetForm: () => void;
  isFormValid: boolean;
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  isValidated: boolean;
  setIsValidated: (validated: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  fileHeaders: string[];
  dataMappings: Record<string, string>;
  setDataMappings: (mappings: Record<string, string>) => void;
}

export interface BatchSummary {
  id: string;
  name: string;
  createdAt: string;
  certificateCount: number;
  status: 'ACTIVE' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
}

export interface BatchUploadFormProps {
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  batchName: string;
  setBatchName: (name: string) => void;
  isValidated: boolean;
  setIsValidated: (validated: boolean) => void;
  expiryDate?: string;
  isProcessing: boolean;
  processingStatus: ProcessingStatus | null;
  onFileUpload: (file: File) => Promise<void>;
}
