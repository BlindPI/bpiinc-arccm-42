
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { ProcessedData, ProcessingStatus } from '@/types/batch-upload';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { findBestCourseMatch } from '../utils/courseMatching';
import { useCourseData } from '@/hooks/useCourseData';

export function useFileProcessor() {
  const { 
    setCurrentStep, 
    setProcessedData, 
    setIsProcessingFile, 
    setProcessingStatus,
    setExtractedCourse,
    setHasCourseMatches,
    enableCourseMatching,
    selectedCourseId
  } = useBatchUpload();
  
  const { data: courses } = useCourseData();

  const processFile = async (file: File) => {
    setIsProcessingFile(true);
    setProcessingStatus({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    });

    try {
      // Read file
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData.length) {
        throw new Error('No data found in file');
      }

      // Extract course information from first row if available
      const firstRow = jsonData[0] as any;
      let extractedCourseInfo = null;
      let courseMatch = null;

      if (enableCourseMatching) {
        // Try to extract course info from the file
        extractedCourseInfo = {
          firstAidLevel: firstRow['First Aid Level'] || firstRow['firstAidLevel'] || null,
          cprLevel: firstRow['CPR Level'] || firstRow['cprLevel'] || null,
          courseName: firstRow['Course'] || firstRow['course'] || null,
          courseLength: firstRow['Course Length'] || firstRow['courseLength'] || null
        };

        if (extractedCourseInfo.firstAidLevel || extractedCourseInfo.cprLevel) {
          setExtractedCourse(extractedCourseInfo);
          
          // Try to find matching course
          if (courses) {
            courseMatch = await findBestCourseMatch(
              extractedCourseInfo,
              selectedCourseId,
              courses
            );
            
            if (courseMatch) {
              setHasCourseMatches(true);
              console.log('Found course match:', courseMatch);
            }
          }
        }
      }

      // Process the data
      const processedData: any[] = [];
      const errors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        try {
          // Extract issue date from row or use a default
          const issueDate = row['Issue Date'] || row['issueDate'] || new Date().toISOString().split('T')[0];
          
          const record = {
            id: `temp-${i}`,
            recipientName: row['Name'] || row['Recipient Name'] || row['name'] || '',
            email: row['Email'] || row['email'] || '',
            phone: row['Phone'] || row['phone'] || '',
            company: row['Company'] || row['company'] || '',
            issueDate,
            expiryDate: new Date(new Date(issueDate).setFullYear(new Date(issueDate).getFullYear() + 2)).toISOString().split('T')[0],
            firstAidLevel: extractedCourseInfo?.firstAidLevel || row['First Aid Level'] || '',
            cprLevel: extractedCourseInfo?.cprLevel || row['CPR Level'] || '',
            assessmentStatus: row['Assessment'] || row['assessment'] || 'PASS',
            courseMatch: courseMatch,
            validationErrors: []
          };

          // Basic validation
          if (!record.recipientName.trim()) {
            record.validationErrors.push('Name is required');
          }
          
          if (!record.email.trim()) {
            record.validationErrors.push('Email is required');
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
            record.validationErrors.push('Invalid email format');
          }

          processedData.push(record);
          
          if (record.validationErrors.length === 0) {
            successCount++;
          }
          
        } catch (rowError) {
          errors.push(`Row ${i + 1}: ${rowError.message}`);
        }

        // Update progress
        setProcessingStatus({
          total: jsonData.length,
          processed: i + 1,
          successful: successCount,
          failed: errors.length,
          errors
        });
      }

      const finalProcessedData: ProcessedData = {
        data: processedData,
        totalCount: processedData.length,
        errorCount: processedData.filter(r => r.validationErrors.length > 0).length
      };

      setProcessedData(finalProcessedData);
      setCurrentStep('REVIEW');
      
      toast.success(`File processed successfully. ${successCount} valid records found.`);

    } catch (error) {
      console.error('File processing error:', error);
      toast.error(`Failed to process file: ${error.message}`);
      setProcessingStatus({
        total: 0,
        processed: 0,
        successful: 0,
        failed: 1,
        errors: [error.message]
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  return { processFile };
}
