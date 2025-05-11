
import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { BatchUploadStep, ProcessingStatus, BatchCertificateData, ProcessedData } from '@/types/batch-upload';

export interface ExtractedCourseInfo {
  id?: string;
  name?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  length?: number;
  expirationMonths?: number;
}

interface BatchCertificateContextType {
  currentStep: BatchUploadStep;
  setCurrentStep: (step: BatchUploadStep) => void;
  
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  processedData: ProcessedData | null;
  setProcessedData: (data: ProcessedData | null) => void;
  isProcessingFile: boolean;
  setIsProcessingFile: (value: boolean) => void;
  
  enableCourseMatching: boolean;
  setEnableCourseMatching: (value: boolean) => void;
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  extractedCourse: ExtractedCourseInfo | null;
  setExtractedCourse: (course: ExtractedCourseInfo | null) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (value: boolean) => void;
  
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  
  validationConfirmed: boolean[];
  setValidationConfirmed: (values: boolean[]) => void;
  isValidated: boolean;
  setIsValidated: (value: boolean) => void;
  
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  processingProgress: number;
  setProcessingProgress: (value: number) => void;
  
  batchName: string;
  setBatchName: (name: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  
  resetBatchUpload: () => void;
}

interface BatchCertificateProviderProps {
  children: ReactNode;
}

const BatchCertificateContext = createContext<BatchCertificateContextType | undefined>(undefined);

export const BatchUploadProvider = ({ children }: BatchCertificateProviderProps) => {
  const [currentStep, setCurrentStep] = useState<BatchUploadStep>('UPLOAD');
  
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const [enableCourseMatching, setEnableCourseMatching] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('none');
  const [extractedCourse, setExtractedCourse] = useState<ExtractedCourseInfo | null>(null);
  const [hasCourseMatches, setHasCourseMatches] = useState(false);
  
  const [selectedLocationId, setSelectedLocationId] = useState<string>('none');
  
  const [validationConfirmed, setValidationConfirmed] = useState<boolean[]>([false, false, false, false, false]);
  const [isValidated, setIsValidated] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const [batchName, setBatchName] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  
  // Renamed from resetForm to resetBatchUpload for consistency
  const resetBatchUpload = () => {
    setCurrentStep('UPLOAD');
    setProcessingStatus(null);
    setProcessedData(null);
    setIsProcessingFile(false);
    setSelectedCourseId('none');
    setExtractedCourse(null);
    setHasCourseMatches(false);
    setValidationConfirmed([false, false, false, false, false]);
    setIsValidated(false);
    setIsSubmitting(false);
    setBatchName('');
    setIssueDate('');
    setProcessingProgress(0);
  };
  
  useEffect(() => {
    setIsValidated(validationConfirmed.every(Boolean));
  }, [validationConfirmed]);
  
  useEffect(() => {
    if (processedData && processedData.data.length > 0 && currentStep === 'UPLOAD') {
      setCurrentStep('REVIEW');
    }
  }, [processedData, currentStep]);
  
  useEffect(() => {
    if (currentStep === 'UPLOAD') {
      setProcessingStatus(null);
    }
  }, [currentStep]);

  return (
    <BatchCertificateContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        processingStatus,
        setProcessingStatus,
        processedData,
        setProcessedData,
        isProcessingFile,
        setIsProcessingFile,
        enableCourseMatching,
        setEnableCourseMatching,
        selectedCourseId,
        setSelectedCourseId,
        selectedLocationId,
        setSelectedLocationId,
        extractedCourse,
        setExtractedCourse,
        hasCourseMatches,
        setHasCourseMatches,
        validationConfirmed,
        setValidationConfirmed,
        isValidated,
        setIsValidated,
        isSubmitting,
        setIsSubmitting,
        batchName,
        setBatchName,
        issueDate,
        setIssueDate,
        processingProgress,
        setProcessingProgress,
        resetBatchUpload
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
