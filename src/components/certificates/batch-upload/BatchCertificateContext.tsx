
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessingStatus } from '@/types/batch-upload';

interface BatchUploadContextType {
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  isValidated: boolean;
  setIsValidated: (validated: boolean) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
}

const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

export function BatchUploadProvider({ children }: { children: ReactNode }) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);

  return (
    <BatchUploadContext.Provider
      value={{
        selectedCourseId,
        setSelectedCourseId,
        issueDate,
        setIssueDate,
        isValidated,
        setIsValidated,
        isUploading,
        setIsUploading,
        processingStatus,
        setProcessingStatus,
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
