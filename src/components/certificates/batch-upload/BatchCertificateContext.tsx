
import { createContext, useContext, useState, ReactNode } from 'react';
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

  // Function to update a specific entry in the processed data
  const updateEntry = (index: number, updates: Partial<RosterEntry>) => {
    if (!processedData) return;

    const updatedData = [...processedData.data];
    updatedData[index] = { ...updatedData[index], ...updates };
    
    // Recalculate error count if we're updating error-related fields
    let newErrorCount = processedData.errorCount;
    if ('hasError' in updates) {
      // If this entry had an error before but doesn't now, decrease the error count
      if (processedData.data[index].hasError && !updates.hasError) {
        newErrorCount--;
      }
      // If this entry didn't have an error before but does now, increase the error count
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

  // Expiry date will be calculated based on the selected course
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
        updateEntry
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
