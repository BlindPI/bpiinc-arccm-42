/**
 * Centralized Assessment Status Processor
 * 
 * This utility consolidates all assessment status processing logic to eliminate
 * the three conflicting implementations across useFileProcessor.ts, useBatchUploadHandler.ts,
 * and validation workflows.
 * 
 * Addresses critical issues:
 * - Silent defaulting to 'PASS' without user warnings
 * - Inconsistent field name recognition
 * - Different grade-to-pass/fail conversion logic
 * - Missing comprehensive fail detection patterns
 */

import { z } from 'zod';

/**
 * Supported assessment status values
 */
export type AssessmentStatus = 'PASS' | 'FAIL' | 'PENDING';

/**
 * Confidence level for assessment status detection
 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

/**
 * Warning types for assessment processing
 */
export type AssessmentWarningType = 
  | 'MISSING_COLUMN'           // No assessment column found
  | 'AMBIGUOUS_VALUE'          // Value could be interpreted multiple ways
  | 'GRADE_CONVERSION'         // Grade was converted to Pass/Fail
  | 'UNEXPECTED_VALUE'         // Value doesn't match known patterns
  | 'COLUMN_NAME_MISMATCH'     // Column name doesn't match expected patterns
  | 'EMPTY_VALUE'              // Assessment field is empty
  | 'DEFAULTED_TO_PASS';       // Defaulted to PASS due to missing/unclear data

/**
 * Assessment processing result with comprehensive metadata
 */
export interface AssessmentProcessingResult {
  /** Final assessment status */
  status: AssessmentStatus;
  
  /** Original value from the data source */
  originalValue: string | null;
  
  /** Field name that was detected and used */
  detectedFieldName: string | null;
  
  /** Confidence level in the detection/conversion */
  confidence: ConfidenceLevel;
  
  /** Warnings about the processing */
  warnings: AssessmentWarning[];
  
  /** Whether this was a grade conversion */
  wasGradeConversion: boolean;
  
  /** Whether this was defaulted due to missing data */
  wasDefaulted: boolean;
}

/**
 * Warning information for assessment processing
 */
export interface AssessmentWarning {
  type: AssessmentWarningType;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  suggestion?: string;
}

/**
 * Configuration for assessment processing
 */
export interface AssessmentProcessingConfig {
  /** Whether to allow grade-to-pass/fail conversion */
  allowGradeConversion: boolean;
  
  /** Whether to default to PASS when assessment data is missing */
  defaultToPassOnMissing: boolean;
  
  /** Whether to be strict about column name matching */
  strictColumnMatching: boolean;
  
  /** Custom grade-to-pass/fail mapping */
  gradeMapping?: Record<string, AssessmentStatus>;
  
  /** Custom field name mappings */
  customFieldMappings?: string[];
}

/**
 * Default configuration
 */
export const DEFAULT_ASSESSMENT_CONFIG: AssessmentProcessingConfig = {
  allowGradeConversion: true,
  defaultToPassOnMissing: true,
  strictColumnMatching: false,
  gradeMapping: {
    'A': 'PASS',
    'B': 'PASS', 
    'C': 'PASS',
    'D': 'PASS',
    'F': 'FAIL',
    'A+': 'PASS',
    'A-': 'PASS',
    'B+': 'PASS',
    'B-': 'PASS',
    'C+': 'PASS',
    'C-': 'PASS',
    'D+': 'PASS',
    'D-': 'PASS'
  }
};

/**
 * Comprehensive list of assessment field name patterns
 * Ordered by priority/specificity
 */
const ASSESSMENT_FIELD_PATTERNS = [
  // Exact matches (highest priority)
  'Pass/Fail',
  'PASS/FAIL', 
  'Pass_Fail',
  'PASS_FAIL',
  
  // Assessment patterns
  'Assessment',
  'ASSESSMENT',
  'assessment',
  'Assessment Status',
  'ASSESSMENT_STATUS',
  'assessment_status',
  'Assessment_Status',
  
  // Grade patterns  
  'Grade',
  'GRADE',
  'grade',
  'Final Grade',
  'FINAL_GRADE',
  'final_grade',
  'Letter Grade',
  'LETTER_GRADE',
  'letter_grade',
  
  // Result patterns
  'Result',
  'RESULT',
  'result',
  'Test Result',
  'TEST_RESULT',
  'test_result',
  'Exam Result',
  'EXAM_RESULT',
  'exam_result',
  
  // Status patterns
  'Status',
  'STATUS',
  'status',
  'Pass Status',
  'PASS_STATUS',
  'pass_status',
  'Completion Status',
  'COMPLETION_STATUS',
  'completion_status',
  
  // Score-related (lower priority)
  'Score',
  'SCORE',
  'score',
  'Final Score',
  'FINAL_SCORE',
  'final_score',
  
  // Generic patterns (lowest priority)
  'P/F',
  'P_F',
  'PF'
];

/**
 * Patterns for PASS detection
 */
const PASS_PATTERNS = [
  // Explicit pass patterns
  /^PASS$/i,
  /^PASSED$/i,
  /^P$/i,
  /^COMPLETE$/i,
  /^COMPLETED$/i,
  /^SUCCESS$/i,
  /^SUCCESSFUL$/i,
  /^YES$/i,
  /^Y$/i,
  /^OK$/i,
  /^GOOD$/i,
  /^ACCEPT$/i,
  /^ACCEPTED$/i,
  
  // Grade patterns (A-D)
  /^A\+?-?$/i,
  /^B\+?-?$/i,
  /^C\+?-?$/i,
  /^D\+?-?$/i,
  
  // Numeric score patterns (80% and above)
  /^(8[0-9]|9[0-9]|100)%?$/,
  
  // Descriptive patterns
  /^SATISFACTORY$/i,
  /^COMPETENT$/i,
  /^PROFICIENT$/i
];

/**
 * Patterns for FAIL detection
 */
const FAIL_PATTERNS = [
  // Explicit fail patterns
  /^FAIL$/i,
  /^FAILED$/i,
  /^F$/i,
  /^INCOMPLETE$/i,
  /^UNSUCCESSFUL$/i,
  /^NO$/i,
  /^N$/i,
  /^REJECT$/i,
  /^REJECTED$/i,
  /^NOT PASS$/i,
  /^NOT_PASS$/i,
  /^NOTPASS$/i,
  
  // Numeric score patterns (below 80%)
  /^([0-7][0-9]?)%?$/,
  
  // Descriptive patterns
  /^UNSATISFACTORY$/i,
  /^INCOMPETENT$/i,
  /^NEEDS IMPROVEMENT$/i,
  /^NEEDS_IMPROVEMENT$/i
];

/**
 * Patterns for PENDING detection
 */
const PENDING_PATTERNS = [
  /^PENDING$/i,
  /^NOT ASSESSED$/i,
  /^NOT_ASSESSED$/i,
  /^NOTASSESSED$/i,
  /^IN PROGRESS$/i,
  /^IN_PROGRESS$/i,
  /^INPROGRESS$/i,
  /^AWAITING$/i,
  /^TBD$/i,
  /^TO BE DETERMINED$/i,
  /^SCHEDULED$/i,
  /^UPCOMING$/i
];

/**
 * Detect assessment field in row data
 * @param rowData - Row data object with column keys
 * @param config - Processing configuration
 * @returns Detected field name or null
 */
export function detectAssessmentField(
  rowData: Record<string, any>,
  config: AssessmentProcessingConfig = DEFAULT_ASSESSMENT_CONFIG
): string | null {
  const availableFields = Object.keys(rowData);
  
  // Check custom field mappings first
  if (config.customFieldMappings) {
    for (const customField of config.customFieldMappings) {
      if (availableFields.includes(customField)) {
        return customField;
      }
    }
  }
  
  // Check standard patterns in priority order
  for (const pattern of ASSESSMENT_FIELD_PATTERNS) {
    if (availableFields.includes(pattern)) {
      return pattern;
    }
  }
  
  // If not strict matching, try case-insensitive and partial matches
  if (!config.strictColumnMatching) {
    for (const pattern of ASSESSMENT_FIELD_PATTERNS) {
      const matchedField = availableFields.find(field => 
        field.toLowerCase() === pattern.toLowerCase() ||
        field.toLowerCase().includes(pattern.toLowerCase()) ||
        pattern.toLowerCase().includes(field.toLowerCase())
      );
      if (matchedField) {
        return matchedField;
      }
    }
  }
  
  return null;
}

/**
 * Normalize assessment value to string
 * @param value - Raw value from data source
 * @returns Normalized string value
 */
function normalizeAssessmentValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  return String(value).trim();
}

/**
 * Determine assessment status from normalized value
 * @param normalizedValue - Normalized assessment value
 * @param config - Processing configuration
 * @returns Assessment detection result
 */
function determineStatusFromValue(
  normalizedValue: string,
  config: AssessmentProcessingConfig
): {
  status: AssessmentStatus;
  confidence: ConfidenceLevel;
  warnings: AssessmentWarning[];
  wasGradeConversion: boolean;
} {
  const warnings: AssessmentWarning[] = [];
  let wasGradeConversion = false;
  
  // Handle empty values
  if (!normalizedValue) {
    return {
      status: config.defaultToPassOnMissing ? 'PASS' : 'PENDING',
      confidence: 'NONE',
      warnings: [{
        type: 'EMPTY_VALUE',
        message: 'Assessment field is empty',
        severity: 'WARNING',
        suggestion: 'Provide explicit Pass/Fail status'
      }],
      wasGradeConversion: false
    };
  }
  
  // Check for explicit FAIL patterns first (highest priority)
  for (const pattern of FAIL_PATTERNS) {
    if (pattern.test(normalizedValue)) {
      return {
        status: 'FAIL',
        confidence: 'HIGH',
        warnings: [],
        wasGradeConversion: false
      };
    }
  }
  
  // Check for explicit PENDING patterns
  for (const pattern of PENDING_PATTERNS) {
    if (pattern.test(normalizedValue)) {
      return {
        status: 'PENDING', 
        confidence: 'HIGH',
        warnings: [],
        wasGradeConversion: false
      };
    }
  }
  
  // Check for explicit PASS patterns
  for (const pattern of PASS_PATTERNS) {
    if (pattern.test(normalizedValue)) {
      // Check if this was a grade conversion
      if (/^[A-DF]\+?-?$/i.test(normalizedValue)) {
        wasGradeConversion = true;
        warnings.push({
          type: 'GRADE_CONVERSION',
          message: `Grade "${normalizedValue}" converted to PASS`,
          severity: 'INFO',
          suggestion: 'Consider using explicit Pass/Fail values'
        });
      }
      
      return {
        status: 'PASS',
        confidence: 'HIGH',
        warnings,
        wasGradeConversion
      };
    }
  }
  
  // Check custom grade mapping
  if (config.allowGradeConversion && config.gradeMapping) {
    const upperValue = normalizedValue.toUpperCase();
    if (upperValue in config.gradeMapping) {
      wasGradeConversion = true;
      const mappedStatus = config.gradeMapping[upperValue];
      
      warnings.push({
        type: 'GRADE_CONVERSION',
        message: `Grade "${normalizedValue}" converted to ${mappedStatus}`,
        severity: 'INFO',
        suggestion: 'Consider using explicit Pass/Fail values'
      });
      
      return {
        status: mappedStatus,
        confidence: 'MEDIUM',
        warnings,
        wasGradeConversion: true
      };
    }
  }
  
  // Unrecognized value - warn and default based on config
  warnings.push({
    type: 'UNEXPECTED_VALUE',
    message: `Unrecognized assessment value: "${normalizedValue}"`,
    severity: 'WARNING',
    suggestion: 'Use standard Pass/Fail values or supported grades'
  });
  
  const defaultStatus = config.defaultToPassOnMissing ? 'PASS' : 'PENDING';
  
  if (defaultStatus === 'PASS') {
    warnings.push({
      type: 'DEFAULTED_TO_PASS',
      message: `Unknown value "${normalizedValue}" defaulted to PASS`,
      severity: 'WARNING',
      suggestion: 'Review and correct assessment values'
    });
  }
  
  return {
    status: defaultStatus,
    confidence: 'LOW',
    warnings,
    wasGradeConversion: false
  };
}

/**
 * Process assessment status from row data
 * @param rowData - Row data with potential assessment fields
 * @param config - Processing configuration
 * @returns Comprehensive assessment processing result
 */
export function processAssessmentStatus(
  rowData: Record<string, any>,
  config: AssessmentProcessingConfig = DEFAULT_ASSESSMENT_CONFIG
): AssessmentProcessingResult {
  const warnings: AssessmentWarning[] = [];
  let wasDefaulted = false;
  
  // Detect assessment field
  const detectedField = detectAssessmentField(rowData, config);
  
  if (!detectedField) {
    // No assessment field found
    warnings.push({
      type: 'MISSING_COLUMN',
      message: 'No assessment status column found in data',
      severity: 'WARNING',
      suggestion: 'Add a Pass/Fail, Grade, or Assessment column'
    });
    
    if (config.defaultToPassOnMissing) {
      warnings.push({
        type: 'DEFAULTED_TO_PASS',
        message: 'Defaulting to PASS due to missing assessment data',
        severity: 'WARNING',
        suggestion: 'Provide explicit assessment status for accurate processing'
      });
      wasDefaulted = true;
    }
    
    return {
      status: config.defaultToPassOnMissing ? 'PASS' : 'PENDING',
      originalValue: null,
      detectedFieldName: null,
      confidence: 'NONE',
      warnings,
      wasGradeConversion: false,
      wasDefaulted
    };
  }
  
  // Get and normalize the value
  const rawValue = rowData[detectedField];
  const normalizedValue = normalizeAssessmentValue(rawValue);
  
  // Determine status from value
  const statusResult = determineStatusFromValue(normalizedValue, config);
  
  // Combine warnings
  const allWarnings = [...warnings, ...statusResult.warnings];
  
  // Check if defaulted
  if (statusResult.confidence === 'NONE' || statusResult.confidence === 'LOW') {
    wasDefaulted = true;
  }
  
  return {
    status: statusResult.status,
    originalValue: normalizedValue || null,
    detectedFieldName: detectedField,
    confidence: statusResult.confidence,
    warnings: allWarnings,
    wasGradeConversion: statusResult.wasGradeConversion,
    wasDefaulted
  };
}

/**
 * Batch process assessment statuses for multiple rows
 * @param rows - Array of row data objects
 * @param config - Processing configuration
 * @returns Array of processing results with summary statistics
 */
export function batchProcessAssessmentStatus(
  rows: Record<string, any>[],
  config: AssessmentProcessingConfig = DEFAULT_ASSESSMENT_CONFIG
): {
  results: AssessmentProcessingResult[];
  summary: {
    totalRows: number;
    passCount: number;
    failCount: number;
    pendingCount: number;
    warningCount: number;
    gradeConversions: number;
    defaultedCount: number;
    fieldDetectionRate: number;
  };
} {
  const results: AssessmentProcessingResult[] = [];
  let passCount = 0;
  let failCount = 0;
  let pendingCount = 0;
  let warningCount = 0;
  let gradeConversions = 0;
  let defaultedCount = 0;
  let fieldsDetected = 0;
  
  for (const row of rows) {
    const result = processAssessmentStatus(row, config);
    results.push(result);
    
    // Update counters
    switch (result.status) {
      case 'PASS': passCount++; break;
      case 'FAIL': failCount++; break; 
      case 'PENDING': pendingCount++; break;
    }
    
    if (result.warnings.length > 0) warningCount++;
    if (result.wasGradeConversion) gradeConversions++;
    if (result.wasDefaulted) defaultedCount++;
    if (result.detectedFieldName) fieldsDetected++;
  }
  
  const fieldDetectionRate = rows.length > 0 ? (fieldsDetected / rows.length) * 100 : 0;
  
  return {
    results,
    summary: {
      totalRows: rows.length,
      passCount,
      failCount,
      pendingCount,
      warningCount,
      gradeConversions,
      defaultedCount,
      fieldDetectionRate
    }
  };
}

/**
 * Validate assessment processing configuration
 * @param config - Configuration to validate
 * @returns Validation result with any errors
 */
export function validateAssessmentConfig(
  config: AssessmentProcessingConfig
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate grade mapping if provided
  if (config.gradeMapping) {
    for (const [grade, status] of Object.entries(config.gradeMapping)) {
      if (!['PASS', 'FAIL', 'PENDING'].includes(status)) {
        errors.push(`Invalid status "${status}" for grade "${grade}". Must be PASS, FAIL, or PENDING.`);
      }
    }
  }
  
  // Validate custom field mappings
  if (config.customFieldMappings) {
    if (!Array.isArray(config.customFieldMappings)) {
      errors.push('customFieldMappings must be an array of strings');
    } else {
      for (const field of config.customFieldMappings) {
        if (typeof field !== 'string' || !field.trim()) {
          errors.push('All custom field mappings must be non-empty strings');
          break;
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a standardized assessment processor function
 * @param config - Configuration for the processor
 * @returns Configured processor function
 */
export function createAssessmentProcessor(
  config: AssessmentProcessingConfig = DEFAULT_ASSESSMENT_CONFIG
) {
  // Validate configuration
  const validation = validateAssessmentConfig(config);
  if (!validation.isValid) {
    throw new Error(`Invalid assessment config: ${validation.errors.join(', ')}`);
  }
  
  return (rowData: Record<string, any>): AssessmentProcessingResult => {
    return processAssessmentStatus(rowData, config);
  };
}

/**
 * Utility function for backward compatibility with existing code
 * @param row - Row data object
 * @returns Simple assessment status string (for drop-in replacement)
 */
export function determineAssessmentStatus(row: Record<string, any>): string {
  const result = processAssessmentStatus(row, DEFAULT_ASSESSMENT_CONFIG);
  return result.status;
}