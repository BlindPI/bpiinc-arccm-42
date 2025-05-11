
import React, { createContext, useContext, useState } from 'react';
import { ProcessingStatus } from '../types';

// Define ExtractedCourseInfo type that was missing
export type ExtractedCourseInfo = {
  name?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  length?: number;
  issueDate?: string;
};

type ValidationError = {
  row: number;
  fields: string[];
  message: string;
};

type CertificateRow = {
  recipientName: string;
  email?: string;
  phone?: string;
  company?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  assessmentStatus?: string;
  issueDate: string;
  expiryDate?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  length?: number;
  [key: string]: any;
};

type BatchStep = 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE';

// Update BatchUploadContextType to include all needed properties
type BatchUploadContextType = {
  validatedRows: CertificateRow[];
  setValidatedRows: React.Dispatch<React.SetStateAction<CertificateRow[]>>;
  validationErrors: ValidationError[];
  setValidationErrors: React.Dispatch<React.SetStateAction<ValidationError[]>>;
  isProcessingFile: boolean;
  setIsProcessingFile: React.Dispatch<React.SetStateAction<boolean>>;
  currentStep: BatchStep;
  setCurrentStep: React.Dispatch<React.SetStateAction<BatchStep>>;
  selectedCourseId: string;
  setSelectedCourseId: React.Dispatch<React.SetStateAction<string>>;
  selectedLocationId: string;
  setSelectedLocationId: React.Dispatch<React.SetStateAction<string>>;
  batchId: string | null;
  setBatchId: React.Dispatch<React.SetStateAction<string | null>>;
  batchName: string | null;
  setBatchName: React.Dispatch<React.SetStateAction<string | null>>;
  processingResults: { success: number; failed: number };
  setProcessingResults: React.Dispatch<React.SetStateAction<{ success: number; failed: number }>>;
  resetForm: () => void;
  // Add missing properties
  processedData: { data: any[]; totalCount: number; errorCount: number } | null;
  setProcessedData: React.Dispatch<React.SetStateAction<{ data: any[]; totalCount: number; errorCount: number } | null>>;
  validationConfirmed: boolean[];
  setValidationConfirmed: React.Dispatch<React.SetStateAction<boolean[]>>;
  isValidated: boolean;
  enableCourseMatching: boolean;
  setEnableCourseMatching: React.Dispatch<React.SetStateAction<boolean>>;
  extractedCourse: ExtractedCourseInfo | null;
  setExtractedCourse: React.Dispatch<React.SetStateAction<ExtractedCourseInfo | null>>;
  hasCourseMatches: boolean;
  setHasCourseMatches: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setBatchInfo: (id: string, name: string) => void;
  // Add the missing property for processing status
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: React.Dispatch<React.SetStateAction<ProcessingStatus | null>>;
};

// Create the context
const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

// Provider component
export function BatchUploadProvider({ children }: { children: React.ReactNode }) {
  const [validatedRows, setValidatedRows] = useState<CertificateRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [currentStep, setCurrentStep] = useState<BatchStep>('UPLOAD');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchName, setBatchName] = useState<string | null>(null);
  const [processingResults, setProcessingResults] = useState({ success: 0, failed: 0 });
  
  // Add the new state variables
  const [processedData, setProcessedData] = useState<{ data: any[]; totalCount: number; errorCount: number } | null>(null);
  const [validationConfirmed, setValidationConfirmed] = useState<boolean[]>([false, false, false]);
  const [enableCourseMatching, setEnableCourseMatching] = useState(true);
  const [extractedCourse, setExtractedCourse] = useState<ExtractedCourseInfo | null>(null);
  const [hasCourseMatches, setHasCourseMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add the missing processingStatus state
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);

  // Compute isValidated based on validationConfirmed
  const isValidated = validationConfirmed.every(Boolean);

  // Function to set both batch ID and name in one call
  const setBatchInfo = (id: string, name: string) => {
    setBatchId(id);
    setBatchName(name);
  };

  // Reset function for starting over
  const resetForm = () => {
    setValidatedRows([]);
    setValidationErrors([]);
    setIsProcessingFile(false);
    setCurrentStep('UPLOAD');
    setSelectedCourseId('');
    setSelectedLocationId('');
    setBatchId(null);
    setBatchName(null);
    setProcessingResults({ success: 0, failed: 0 });
    setProcessedData(null);
    setValidationConfirmed([false, false, false]);
    setEnableCourseMatching(true);
    setExtractedCourse(null);
    setHasCourseMatches(false);
    setIsSubmitting(false);
    setProcessingStatus(null);
  };

  return (
    <BatchUploadContext.Provider
      value={{
        validatedRows,
        setValidatedRows,
        validationErrors,
        setValidationErrors,
        isProcessingFile,
        setIsProcessingFile,
        currentStep,
        setCurrentStep,
        selectedCourseId,
        setSelectedCourseId,
        selectedLocationId,
        setSelectedLocationId,
        batchId,
        setBatchId,
        batchName,
        setBatchName,
        processingResults,
        setProcessingResults,
        resetForm,
        // Add the new values to the context
        processedData,
        setProcessedData,
        validationConfirmed,
        setValidationConfirmed,
        isValidated,
        enableCourseMatching,
        setEnableCourseMatching,
        extractedCourse,
        setExtractedCourse,
        hasCourseMatches,
        setHasCourseMatches,
        isSubmitting,
        setIsSubmitting,
        setBatchInfo,
        // Add the missing processingStatus values
        processingStatus,
        setProcessingStatus
      }}
    >
      {children}
    </BatchUploadContext.Provider>
  );
}

// Hook for using the batch upload context
export function useBatchUpload() {
  const context = useContext(BatchUploadContext);
  if (context === undefined) {
    throw new Error('useBatchUpload must be used within a BatchUploadProvider');
  }
  return context;
}
