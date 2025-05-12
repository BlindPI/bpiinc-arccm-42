
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessingStatus, RowData } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExtractedCourseInfo {
  firstAidLevel?: string;
  cprLevel?: string;
  instructorLevel?: string;
  length?: number;
  assessmentStatus?: string;
  issueDate?: string;
  instructorName?: string;
}

export interface BatchUploadContextType {
  currentStep: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE';
  setCurrentStep: (step: 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE') => void;
  selectedCourseId: string;
  setSelectedCourseId: (courseId: string) => void;
  selectedLocationId: string;
  setSelectedLocationId: (locationId: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  enableCourseMatching: boolean;
  setEnableCourseMatching: (enable: boolean) => void;
  isProcessingFile: boolean;
  setIsProcessingFile: (isProcessing: boolean) => void;
  processingStatus: ProcessingStatus | null;
  setProcessingStatus: (status: ProcessingStatus) => void;
  processedData: {
    data: any[];
    totalCount: number;
    errorCount: number;
  } | null;
  setProcessedData: (data: { data: any[]; totalCount: number; errorCount: number } | null) => void;
  extractedCourse: ExtractedCourseInfo | null;
  setExtractedCourse: (course: ExtractedCourseInfo | null) => void;
  hasCourseMatches: boolean;
  setHasCourseMatches: (has: boolean) => void;
  resetForm: () => void;
  isFormValid: boolean;
  rosterName: string;
  setRosterName: (name: string) => void;
  rosterDescription: string;
  setRosterDescription: (description: string) => void;
}

const BatchUploadContext = createContext<BatchUploadContextType | undefined>(undefined);

export const BatchCertificateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE'>('UPLOAD');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [enableCourseMatching, setEnableCourseMatching] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processedData, setProcessedData] = useState<{ data: any[]; totalCount: number; errorCount: number } | null>(null);
  const [extractedCourse, setExtractedCourse] = useState<ExtractedCourseInfo | null>(null);
  const [hasCourseMatches, setHasCourseMatches] = useState(false);
  const [rosterName, setRosterName] = useState('');
  const [rosterDescription, setRosterDescription] = useState('');

  const resetForm = () => {
    setCurrentStep('UPLOAD');
    setSelectedCourseId('');
    setSelectedLocationId('');
    setIssueDate('');
    setEnableCourseMatching(true);
    setIsProcessingFile(false);
    setProcessingStatus(null);
    setProcessedData(null);
    setExtractedCourse(null);
    setHasCourseMatches(false);
    setRosterName('');
    setRosterDescription('');
  };

  const isFormValid = currentStep === 'UPLOAD' 
    ? !!processedData && (processedData.errorCount === 0) && !!selectedCourseId && !!issueDate
    : currentStep === 'REVIEW'
      ? !!processedData && (processedData.errorCount === 0) && !!rosterName
      : false;

  return (
    <BatchUploadContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        selectedCourseId,
        setSelectedCourseId,
        selectedLocationId,
        setSelectedLocationId,
        issueDate,
        setIssueDate,
        enableCourseMatching,
        setEnableCourseMatching,
        isProcessingFile,
        setIsProcessingFile,
        processingStatus,
        setProcessingStatus,
        processedData,
        setProcessedData,
        extractedCourse,
        setExtractedCourse,
        hasCourseMatches,
        setHasCourseMatches,
        resetForm,
        isFormValid,
        rosterName,
        setRosterName,
        rosterDescription,
        setRosterDescription
      }}
    >
      {children}
    </BatchUploadContext.Provider>
  );
};

export const useBatchUpload = (): BatchUploadContextType => {
  const context = useContext(BatchUploadContext);
  if (context === undefined) {
    throw new Error('useBatchUpload must be used within a BatchCertificateProvider');
  }
  return context;
};
