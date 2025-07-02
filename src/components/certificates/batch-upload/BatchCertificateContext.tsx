import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedData, ProcessingStatus } from '@/types/batch-upload';

export interface ExtractedCourseInfo {
  courseName: string;
  name?: string; // Add this property for compatibility
  firstAidLevel?: string;
  cprLevel?: string;
  courseLength?: string;
  matchedCourseId?: string;
  confidence?: number;
}

interface BatchUploadContextType {
  // Step management
  currentStep: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE';
  setCurrentStep: (step: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE') => void;
  
  // File processing
  processedData: ProcessedData | null;
  setProcessedData: (data: ProcessedData | null) => void;
  isProcessingFile: boolean;
  setIsProcessingFile: (processing: boolean) => void;
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  
  // Course matching
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enabled: boolean) => void;
  selectedCourseId: string;
  setSelectedCourseId: (courseId: string) => void;
  extractedCourse: ExtractedCourseInfo | null;
  setExtractedCourse: (course: ExtractedCourseInfo | null) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (has: boolean) => void;
  
  // Location selection (mandatory in review)
  selectedLocationId: string;
  setSelectedLocationId: (locationId: string) => void;
  
  // Validation
  validationConfirmed: Record<string, boolean>;
  setValidationConfirmed: (confirmations: Record<string, boolean>) => void;
  isValidated: boolean;
  
  // Form management
  resetForm: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  
  // Navigation
  onNavigateToTab?: (tabValue: string) => void;
}

const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

export function BatchUploadProvider({ 
  children, 
  onNavigateToTab 
}: { 
  children: ReactNode;
  onNavigateToTab?: (tabValue: string) => void;
}) {
  // Step management
  const [currentStep, setCurrentStep] = useState<'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE'>('UPLOAD');
  
  // File processing
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  
  // Course matching
  const [enableCourseMatching, setEnableCourseMatching] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('none');
  const [extractedCourse, setExtractedCourse] = useState<ExtractedCourseInfo | null>(null);
  const [hasCourseMatches, setHasCourseMatches] = useState(false);
  
  // Location selection (mandatory)
  const [selectedLocationId, setSelectedLocationId] = useState('');
  
  // Validation
  const [validationConfirmed, setValidationConfirmed] = useState<Record<string, boolean>>({});
  
  // Form management
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate if validation is complete
  const isValidated = Object.keys(validationConfirmed).length > 0 && 
    Object.values(validationConfirmed).every(confirmed => confirmed);

  const resetForm = () => {
    setCurrentStep('UPLOAD');
    setProcessedData(null);
    setIsProcessingFile(false);
    setProcessingStatus(null);
    setExtractedCourse(null);
    setHasCourseMatches(false);
    setSelectedLocationId('');
    setValidationConfirmed({});
    setIsSubmitting(false);
    // Keep course matching settings and selected course
  };

  const value: BatchUploadContextType = {
    // Step management
    currentStep,
    setCurrentStep,
    
    // File processing
    processedData,
    setProcessedData,
    isProcessingFile,
    setIsProcessingFile,
    processingStatus,
    setProcessingStatus,
    
    // Course matching
    enableCourseMatching,
    setEnableCourseMatching,
    selectedCourseId,
    setSelectedCourseId,
    extractedCourse,
    setExtractedCourse,
    hasCourseMatches,
    setHasCourseMatches,
    
    // Location selection
    selectedLocationId,
    setSelectedLocationId,
    
    // Validation
    validationConfirmed,
    setValidationConfirmed,
    isValidated,
    
    // Form management
    resetForm,
    isSubmitting,
    setIsSubmitting,
    
    // Navigation
    onNavigateToTab,
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
