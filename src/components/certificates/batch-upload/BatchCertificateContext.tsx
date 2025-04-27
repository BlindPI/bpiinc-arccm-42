
import { useState, createContext, useContext, ReactNode } from 'react';

interface BatchCertificateContextType {
  isReviewMode: boolean;
  setIsReviewMode: (value: boolean) => void;
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  processedData: ProcessedData | null;
  setProcessedData: (data: ProcessedData | null) => void;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (value: boolean) => void;
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  extractedCourse: any; // Course object extracted from file data
  setExtractedCourse: (course: any) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (value: boolean) => void;
  isValidated: boolean;
  setIsValidated: (value: boolean) => void;
}

interface BatchCertificateProviderProps {
  children: ReactNode;
}

interface ProcessingStatus {
  processed: number;
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

interface ProcessedData {
  data: any[];
  totalCount: number;
  errorCount: number;
}

const BatchCertificateContext = createContext<BatchCertificateContextType | undefined>(undefined);

export const BatchUploadProvider = ({ children }: BatchCertificateProviderProps) => {
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [enableCourseMatching, setEnableCourseMatching] = useState(true); // Default to enabled
  const [selectedCourseId, setSelectedCourseId] = useState<string>('none');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedCourse, setExtractedCourse] = useState<any>(null);
  const [hasCourseMatches, setHasCourseMatches] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  return (
    <BatchCertificateContext.Provider
      value={{
        isReviewMode,
        setIsReviewMode,
        processingStatus,
        setProcessingStatus,
        processedData,
        setProcessedData,
        enableCourseMatching,
        setEnableCourseMatching,
        selectedCourseId,
        setSelectedCourseId,
        selectedLocationId,
        setSelectedLocationId,
        isSubmitting,
        setIsSubmitting,
        extractedCourse,
        setExtractedCourse,
        hasCourseMatches,
        setHasCourseMatches,
        isValidated,
        setIsValidated
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
