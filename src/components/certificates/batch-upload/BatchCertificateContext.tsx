import { useState, createContext, useContext, ReactNode, useEffect } from 'react';

export interface ProcessingStatus {
  processed: number;
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface ProcessedData {
  data: any[];
  totalCount: number;
  errorCount: number;
}

export interface ExtractedCourseInfo {
  id?: string;
  name?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  length?: number;
  expirationMonths?: number;
}

interface BatchCertificateContextType {
  currentStep: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE';
  setCurrentStep: (step: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE') => void;
  
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
  
  resetForm: () => void;
}

interface BatchCertificateProviderProps {
  children: ReactNode;
}

const BatchCertificateContext = createContext<BatchCertificateContextType | undefined>(undefined);

export const BatchUploadProvider = ({ children }: BatchCertificateProviderProps) => {
  const [currentStep, setCurrentStep] = useState<'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE'>('UPLOAD');
  
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
  
  const resetForm = () => {
    setCurrentStep('UPLOAD');
    setProcessingStatus(null);
    setProcessedData(null);
    setIsProcessingFile(false);
    setSelectedCourseId('none');
    setExtractedCourse(null);
    setHasCourseMatches(false);
    setValidationConfirmed([false, false, false, false, false]);
    setIsValidated(false);
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
      setProcessedData(null);
    }
  }, [currentStep]);
  
  useEffect(() => {
    if (currentStep === 'COMPLETE') {
      const timer = setTimeout(() => {
        resetForm();
      }, 3000);
      return () => clearTimeout(timer);
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
        resetForm
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
