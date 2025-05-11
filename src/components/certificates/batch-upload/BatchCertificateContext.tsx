
import React, { createContext, useContext, useState } from 'react';

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
        resetForm
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
