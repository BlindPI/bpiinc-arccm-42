
import { ProcessingStatus, RowData } from '../types';

// Re-export the types to maintain backward compatibility
export type { ProcessingStatus, RowData };

// Add any additional types specific to batch upload process here
export interface BatchUploadContextType {
  currentStep: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE';
  setCurrentStep: (step: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE') => void;
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
  processedData: {
    data: any[];
    totalCount: number;
    errorCount: number;
  } | null;
  setProcessedData: (data: { data: any[]; totalCount: number; errorCount: number } | null) => void;
  extractedCourse: any | null;
  setExtractedCourse: (course: any | null) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (has: boolean) => void;
  resetForm: () => void;
  isFormValid: boolean;
}
