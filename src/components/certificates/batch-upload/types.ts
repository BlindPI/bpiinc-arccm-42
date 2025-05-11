
import { ProcessingStatus, RowData } from '../types';

// Re-export the types to maintain backward compatibility
export type { ProcessingStatus, RowData };

// Import ExtractedCourseInfo from the context
import { ExtractedCourseInfo } from './BatchCertificateContext';

// Add any additional types specific to batch upload process here
export interface BatchUploadContextType {
  currentStep: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE';
  setCurrentStep: (step: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE') => void;
  selectedCourseId: string;
  setSelectedCourseId: (courseId: string) => void;
  selectedLocationId: string;
  setSelectedLocationId: (locationId: string) => void;
  isProcessingFile: boolean;
  setIsProcessingFile: (isProcessing: boolean) => void;
  processedData: { data: any[]; totalCount: number; errorCount: number } | null;
  setProcessedData: (data: { data: any[]; totalCount: number; errorCount: number } | null) => void;
  validationConfirmed: boolean[];
  setValidationConfirmed: (confirmations: boolean[]) => void;
  isValidated: boolean;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enable: boolean) => void;
  extractedCourse: ExtractedCourseInfo | null;
  setExtractedCourse: (course: ExtractedCourseInfo | null) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (has: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  batchId: string | null;
  setBatchId: (id: string | null) => void;
  batchName: string | null;
  setBatchName: (name: string | null) => void;
  processingResults: { success: number; failed: number };
  setProcessingResults: (results: { success: number; failed: number }) => void;
  validatedRows: any[];
  setValidatedRows: (rows: any[]) => void;
  validationErrors: any[];
  setValidationErrors: (errors: any[]) => void;
  resetForm: () => void;
  setBatchInfo: (id: string, name: string) => void;
}
