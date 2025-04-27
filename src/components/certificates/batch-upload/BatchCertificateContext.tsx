
import React, { createContext, useContext, useState } from 'react';
import { ProcessedData, ProcessingStatus } from '@/types/batch-upload';

type BatchUploadContextType = {
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  processedData: ProcessedData | null;
  setProcessedData: (data: ProcessedData | null) => void;
  isReviewMode: boolean;
  setIsReviewMode: (isReview: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enable: boolean) => void;
  isValidated: boolean;
  setIsValidated: (isValidated: boolean) => void;
  selectedCourseId: string;
  setSelectedCourseId: (courseId: string) => void;
  selectedLocationId: string;
  setSelectedLocationId: (locationId: string) => void;
  extractedCourse: any;
  setExtractedCourse: (course: any) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (hasMatches: boolean) => void;
};

const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

export function BatchUploadProvider({ children }: { children: React.ReactNode }) {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableCourseMatching, setEnableCourseMatching] = useState(true); // Default to true
  const [isValidated, setIsValidated] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [extractedCourse, setExtractedCourse] = useState<any>(null);
  const [hasCourseMatches, setHasCourseMatches] = useState(false);

  const value = {
    processingStatus,
    setProcessingStatus,
    processedData,
    setProcessedData,
    isReviewMode,
    setIsReviewMode,
    isSubmitting,
    setIsSubmitting,
    enableCourseMatching,
    setEnableCourseMatching,
    isValidated,
    setIsValidated,
    selectedCourseId,
    setSelectedCourseId,
    selectedLocationId,
    setSelectedLocationId,
    extractedCourse,
    setExtractedCourse,
    hasCourseMatches,
    setHasCourseMatches
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
    throw new Error('useBatchUpload must be used within a BatchUploadProvider');
  }
  return context;
}
