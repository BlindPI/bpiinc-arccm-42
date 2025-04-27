
import React, { createContext, useContext, useState } from 'react';
import type { RosterEntry } from '../utils/rosterValidation';
import type { ProcessingStatus } from '../types';

interface BatchUploadContextType {
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  processedData: { data: RosterEntry[]; totalCount: number; errorCount: number } | null;
  setProcessedData: (data: { data: RosterEntry[]; totalCount: number; errorCount: number } | null) => void;
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (value: boolean) => void;
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  extractedCourse: { id: string; name: string } | null;
  setExtractedCourse: (course: { id: string; name: string } | null) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (value: boolean) => void;
  validationErrors: string[];
  setValidationErrors: (errors: string[]) => void;
  isValidated: boolean;
  setIsValidated: (value: boolean) => void;
  updateEntry: (index: number, updates: Partial<RosterEntry>) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
}

const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

export function BatchCertificateProvider({ children }: { children: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processedData, setProcessedData] = useState<{ data: RosterEntry[]; totalCount: number; errorCount: number } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [enableCourseMatching, setEnableCourseMatching] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [extractedCourse, setExtractedCourse] = useState<{ id: string; name: string } | null>(null);
  const [hasCourseMatches, setHasCourseMatches] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [issueDate, setIssueDate] = useState('');

  const updateEntry = (index: number, updates: Partial<RosterEntry>) => {
    setProcessedData(current => {
      if (!current) return null;
      const newData = [...current.data];
      newData[index] = { ...newData[index], ...updates };
      return {
        ...current,
        data: newData,
        errorCount: newData.filter(entry => entry.hasError).length
      };
    });
  };

  const value = {
    isUploading,
    setIsUploading,
    isSubmitting,
    setIsSubmitting,
    processedData,
    setProcessedData,
    processingStatus,
    setProcessingStatus,
    enableCourseMatching,
    setEnableCourseMatching,
    selectedCourseId,
    setSelectedCourseId,
    extractedCourse,
    setExtractedCourse,
    hasCourseMatches,
    setHasCourseMatches,
    validationErrors,
    setValidationErrors,
    isValidated,
    setIsValidated,
    updateEntry,
    issueDate,
    setIssueDate,
  };

  return (
    <BatchUploadContext.Provider value={value}>
      {children}
    </BatchUploadContext.Provider>
  );
}

export function useBatchUpload() {
  const context = useContext(BatchUploadContext);
  if (context === undefined) {
    throw new Error('useBatchUpload must be used within a BatchCertificateProvider');
  }
  return context;
}
