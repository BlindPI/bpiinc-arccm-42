
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedData } from '@/types/batch-upload';

export type BatchUploadStep = 'UPLOAD' | 'REVIEW' | 'COMPLETE' | 'SUBMITTING';

export interface ExtractedCourseInfo {
  firstAidLevel?: string;
  cprLevel?: string;
  instructorLevel?: string;
  instructorName?: string;
  length?: number;
  assessmentStatus?: string;
  issueDate?: string;
  name?: string; // Added name property
}

interface BatchCertificateContextType {
  currentStep: BatchUploadStep;
  setCurrentStep: (step: BatchUploadStep) => void;
  processedData: ProcessedData | null;
  setProcessedData: (data: ProcessedData | null) => void;
  validationConfirmed: boolean[];
  setValidationConfirmed: (confirmed: boolean[]) => void;
  isValidated: boolean;
  selectedCourseId: string;
  setSelectedCourseId: (courseId: string) => void;
  selectedLocationId: string;
  setSelectedLocationId: (locationId: string) => void;
  extractedCourse: ExtractedCourseInfo | null;
  setExtractedCourse: (courseInfo: ExtractedCourseInfo | null) => void;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enable: boolean) => void;
  batchId: string | null;
  batchName: string | null;
  setBatchInfo: (id: string | null, name: string | null) => void;
  // Add missing properties
  isProcessingFile: boolean;
  setIsProcessingFile: (isProcessing: boolean) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (hasMatches: boolean) => void;
  resetForm: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  processingStatus: any;
  setProcessingStatus: (status: any) => void;
}

const BatchCertificateContext = createContext<BatchCertificateContextType | undefined>(undefined);

export const BatchUploadProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState<BatchUploadStep>('UPLOAD');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [validationConfirmed, setValidationConfirmed] = useState<boolean[]>([false, false, false]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('none');
  const [extractedCourse, setExtractedCourse] = useState<ExtractedCourseInfo | null>(null);
  const [enableCourseMatching, setEnableCourseMatching] = useState<boolean>(true);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchName, setBatchName] = useState<string | null>(null);
  // Add missing state variables
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [hasCourseMatches, setHasCourseMatches] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  
  // Compute whether all validations are confirmed
  const isValidated = validationConfirmed.every(Boolean);
  
  // Set batch ID and name together
  const setBatchInfo = (id: string | null, name: string | null) => {
    setBatchId(id);
    setBatchName(name);
  };

  // Add resetForm function
  const resetForm = () => {
    setCurrentStep('UPLOAD');
    setProcessedData(null);
    setValidationConfirmed([false, false, false]);
    setSelectedCourseId('');
    setSelectedLocationId('none');
    setExtractedCourse(null);
    setIsProcessingFile(false);
    setHasCourseMatches(false);
    setIsSubmitting(false);
    setProcessingStatus(null);
    setBatchId(null);
    setBatchName(null);
  };

  return (
    <BatchCertificateContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        processedData,
        setProcessedData,
        validationConfirmed,
        setValidationConfirmed,
        isValidated,
        selectedCourseId,
        setSelectedCourseId,
        selectedLocationId,
        setSelectedLocationId,
        extractedCourse,
        setExtractedCourse,
        enableCourseMatching,
        setEnableCourseMatching,
        batchId,
        batchName,
        setBatchInfo,
        // Add missing properties
        isProcessingFile,
        setIsProcessingFile,
        hasCourseMatches,
        setHasCourseMatches,
        resetForm,
        isSubmitting,
        setIsSubmitting,
        processingStatus,
        setProcessingStatus
      }}
    >
      {children}
    </BatchCertificateContext.Provider>
  );
};

export const useBatchUpload = () => {
  const context = useContext(BatchCertificateContext);
  if (context === undefined) {
    throw new Error('useBatchUpload must be used within a BatchUploadProvider');
  }
  return context;
};
