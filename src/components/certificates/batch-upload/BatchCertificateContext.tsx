
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedData } from '@/types/batch-upload';

export interface ExtractedCourseInfo {
  courseName: string;
  firstAidLevel?: string;
  cprLevel?: string;
  courseLength?: string;
  matchedCourseId?: string;
  confidence?: number;
}

interface BatchUploadContextType {
  // File processing
  processedData: ProcessedData | null;
  setProcessedData: (data: ProcessedData | null) => void;
  isProcessingFile: boolean;
  setIsProcessingFile: (processing: boolean) => void;
  
  // Course matching
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enabled: boolean) => void;
  selectedCourseId: string;
  setSelectedCourseId: (courseId: string) => void;
  extractedCourse: ExtractedCourseInfo | null;
  setExtractedCourse: (course: ExtractedCourseInfo | null) => void;
  
  // Location selection (mandatory in review)
  selectedLocationId: string;
  setSelectedLocationId: (locationId: string) => void;
  
  // Validation
  validationConfirmed: Record<string, boolean>;
  setValidationConfirmed: (confirmations: Record<string, boolean>) => void;
  isValidated: boolean;
}

const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

export function BatchUploadProvider({ children }: { children: ReactNode }) {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // Course matching
  const [enableCourseMatching, setEnableCourseMatching] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('none');
  const [extractedCourse, setExtractedCourse] = useState<ExtractedCourseInfo | null>(null);
  
  // Location selection (mandatory)
  const [selectedLocationId, setSelectedLocationId] = useState('');
  
  // Validation
  const [validationConfirmed, setValidationConfirmed] = useState<Record<string, boolean>>({});
  
  // Calculate if validation is complete
  const isValidated = Object.keys(validationConfirmed).length > 0 && 
    Object.values(validationConfirmed).every(confirmed => confirmed);

  const value: BatchUploadContextType = {
    // File processing
    processedData,
    setProcessedData,
    isProcessingFile,
    setIsProcessingFile,
    
    // Course matching
    enableCourseMatching,
    setEnableCourseMatching,
    selectedCourseId,
    setSelectedCourseId,
    extractedCourse,
    setExtractedCourse,
    
    // Location selection
    selectedLocationId,
    setSelectedLocationId,
    
    // Validation
    validationConfirmed,
    setValidationConfirmed,
    isValidated,
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
