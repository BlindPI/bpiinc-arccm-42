import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ProcessingStatus } from '../types';
import type { RosterEntry } from '../utils/rosterValidation';

interface BatchUploadContextType {
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  isValidated: boolean;
  setIsValidated: (validated: boolean) => void;
  expiryDate: string;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  processedData: {
    data: RosterEntry[];
    totalCount: number;
    errorCount: number;
  } | null;
  setProcessedData: (data: {
    data: RosterEntry[];
    totalCount: number;
    errorCount: number;
  } | null) => void;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enabled: boolean) => void;
  isReviewMode: boolean;
  setIsReviewMode: (reviewMode: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  updateEntry: (index: number, updates: Partial<RosterEntry>) => void;
  extractedCourse?: {
    id: string;
    name: string;
    issueDate?: string;
  };
  setExtractedCourse: (course: { id: string; name: string; issueDate?: string } | undefined) => void;
}

const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

export function BatchUploadProvider({ children }: { children: ReactNode }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processedData, setProcessedData] = useState<{
    data: RosterEntry[];
    totalCount: number;
    errorCount: number;
  } | null>(null);
  const [enableCourseMatching, setEnableCourseMatching] = useState(true);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedCourse, setExtractedCourse] = useState<{
    id: string;
    name: string;
    issueDate?: string;
  }>();

  useEffect(() => {
    if (!isReviewMode) {
      setSelectedCourseId('');
      setIssueDate('');
      setIsValidated(false);
      setProcessedData(null);
      setProcessingStatus(null);
      setExtractedCourse(undefined);
    }
  }, [isReviewMode]);

  const updateEntry = (index: number, updates: Partial<RosterEntry>) => {
    if (!processedData) return;

    const updatedData = [...processedData.data];
    updatedData[index] = { ...updatedData[index], ...updates };
    
    let newErrorCount = processedData.errorCount;
    if ('hasError' in updates) {
      if (processedData.data[index].hasError && !updates.hasError) {
        newErrorCount--;
      }
      else if (!processedData.data[index].hasError && updates.hasError) {
        newErrorCount++;
      }
    }

    setProcessedData({
      data: updatedData,
      totalCount: processedData.totalCount,
      errorCount: newErrorCount
    });
  };

  const expiryDate = '';

  return (
    <BatchUploadContext.Provider
      value={{
        selectedCourseId,
        setSelectedCourseId,
        issueDate,
        setIssueDate,
        isValidated,
        setIsValidated,
        expiryDate,
        isUploading,
        setIsUploading,
        processingStatus,
        setProcessingStatus,
        processedData,
        setProcessedData,
        enableCourseMatching,
        setEnableCourseMatching,
        isReviewMode,
        setIsReviewMode,
        isSubmitting,
        setIsSubmitting,
        updateEntry,
        extractedCourse,
        setExtractedCourse
      }}
    >
      {children}
    </BatchUploadContext.Provider>
  );
}

export function useBatchUpload() {
  const context = useContext(BatchUploadContext);
  if (context === undefined) {
    throw new Error('useBatchUpload must be used within a BatchUploadProvider');
  }
  return context;
}
