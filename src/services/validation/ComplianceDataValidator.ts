import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
}

export interface ValidationMetadata {
  validatedAt: string;
  validatedBy: string;
  validationRules: string[];
  dataSize: number;
  processingTime: number;
}

export interface FileValidationResult extends ValidationResult {
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: Date;
  };
  contentValidation: {
    isReadable: boolean;
    encoding: string;
    structure: 'valid' | 'invalid' | 'partial';
  };
}

export interface ComplianceSubmissionData {
  userId: string;
  metricId: string;
  submissionType: string;
  data: any;
  files?: File[];
  metadata?: Record<string, any>;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'required' | 'format' | 'range' | 'custom' | 'business';
  field?: string;
  condition: string;
  errorMessage: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
}

export class ComplianceDataValidator {
  private static instance: ComplianceDataValidator;
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private customValidators: Map<string, Function> = new Map();
  
  private constructor() {
    this.initializeValidationRules();
    this.initializeCustomValidators();
  }
  
  public static getInstance(): ComplianceDataValidator {
    if (!ComplianceDataValidator.instance) {
      ComplianceDataValidator.instance = new ComplianceDataValidator();
    }
    return ComplianceDataValidator.instance;
  }
  
  private initializeValidationRules() {
    // Default validation rules for different submission types
    const commonRules: ValidationRule[] = [
      {
        id: 'user_id_required',
        name: 'User ID Required',
        description: 'User ID must be provided',
        type: 'required',
        field: 'userId',
        condition: 'notEmpty',
        errorMessage: 'User ID is required for all submissions',
        severity: 'critical',
        isActive: true
      },
      {
        id: 'metric_id_required',
        name: 'Metric ID Required',
        description: 'Compliance metric ID must be provided',
        type: 'required',
        field: 'metricId',
        condition: 'notEmpty',
        errorMessage: 'Compliance metric ID is required',
        severity: 'critical',
        isActive: true
      },
      {
        id: 'submission_type_valid',
        name: 'Valid Submission Type',
        description: 'Submission type must be valid',
        type: 'format',
        field: 'submissionType',
        condition: 'enum:certification,training,assessment,background_check,document',
        errorMessage: 'Invalid submission type provided',
        severity: 'high',
        isActive: true
      }
    ];
    
    const certificationRules: ValidationRule[] = [
      ...commonRules,
      {
        id: 'cert_number_format',
        name: 'Certificate Number Format',
        description: 'Certificate number must follow valid format',
        type: 'format',
        field: 'data.certificateNumber',
        condition: 'regex:^[A-Z0-9]{6,20}$',
        errorMessage: 'Certificate number must be 6-20 characters, alphanumeric',
        severity: 'high',
        isActive: true
      },
      {
        id: 'cert_expiry_future',
        name: 'Certificate Expiry Future Date',
        description: 'Certificate expiry must be in the future',
        type: 'range',
        field: 'data.expiryDate',
        condition: 'futureDate',
        errorMessage: 'Certificate expiry date must be in the future',
        severity: 'high',
        isActive: true
      },
      {
        id: 'cert_issuer_valid',
        name: 'Valid Certificate Issuer',
        description: 'Certificate issuer must be from approved list',
        type: 'business',
        field: 'data.issuer',
        condition: 'approvedIssuer',
        errorMessage: 'Certificate issuer is not on the approved list',
        severity: 'medium',
        isActive: true
      }
    ];
    
    const trainingRules: ValidationRule[] = [
      ...commonRules,
      {
        id: 'training_hours_valid',
        name: 'Valid Training Hours',
        description: 'Training hours must be reasonable',
        type: 'range',
        field: 'data.hours',
        condition: 'range:0.5,200',
        errorMessage: 'Training hours must be between 0.5 and 200',
        severity: 'medium',
        isActive: true
      },
      {
        id: 'training_completion_date',
        name: 'Training Completion Date',
        description: 'Training completion date must be valid',
        type: 'range',
        field: 'data.completionDate',
        condition: 'pastDate',
        errorMessage: 'Training completion date cannot be in the future',
        severity: 'high',
        isActive: true
      }
    ];
    
    const assessmentRules: ValidationRule[] = [
      ...commonRules,
      {
        id: 'assessment_score_range',
        name: 'Assessment Score Range',
        description: 'Assessment score must be within valid range',
        type: 'range',
        field: 'data.score',
        condition: 'range:0,100',
        errorMessage: 'Assessment score must be between 0 and 100',
        severity: 'high',
        isActive: true
      },
      {
        id: 'passing_score_met',
        name: 'Passing Score Requirement',
        description: 'Score must meet minimum passing requirement',
        type: 'business',
        field: 'data.score',
        condition: 'passingScore',
        errorMessage: 'Score does not meet minimum passing requirement',
        severity: 'high',
        isActive: true
      }
    ];
    
    this.validationRules.set('certification', certificationRules);
    this.validationRules.set('training', trainingRules);
    this.validationRules.set('assessment', assessmentRules);
    this.validationRules.set('background_check', commonRules);
    this.validationRules.set('document', commonRules);
  }
  
  private initializeCustomValidators() {
    // Custom validation functions
    this.customValidators.set('approvedIssuer', async (value: string) => {
      try {
        const result = await supabase
          .from('compliance_metrics') // Using existing table as proxy
          .select('name')
          .eq('name', value)
          .eq('is_active', true)
          .single();
        
        return !result.error && result.data;
      } catch {
        return false;
      }
    });
    
    this.customValidators.set('passingScore', async (score: number, context: any) => {
      try {
        const result = await supabase
          .from('compliance_metrics')
          .select('id, name') // Select available fields
          .eq('id', context.metricId)
          .single();
        
        if (result.error || !result.data) return false;
        
        // Mock passing score since the field doesn't exist in schema
        const passingScore = 70;
        return score >= passingScore;
      } catch {
        return false;
      }
    });
    
    this.customValidators.set('duplicateCheck', async (data: any, context: any) => {
      try {
        const result = await supabase
          .from('user_compliance_records')
          .select('id')
          .eq('user_id', context.userId)
          .eq('metric_id', context.metricId)
          .eq('compliance_status', 'compliant')
          .single();
        
        return result.error; // Return true if no existing record (error means not found)
      } catch {
        return true;
      }
    });
  }
  
  public async validateSubmission(submission: ComplianceSubmissionData): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const appliedRules: string[] = [];
    
    try {
      // Get validation rules for submission type
      const rules = this.validationRules.get(submission.submissionType) || [];
      
      // Basic structure validation
      const structureValidation = await this.validateStructure(submission);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);
      
      // Apply validation rules
      for (const rule of rules.filter(r => r.isActive)) {
        appliedRules.push(rule.id);
        
        const ruleResult = await this.applyValidationRule(rule, submission);
        if (!ruleResult.isValid) {
          errors.push({
            code: rule.id,
            message: rule.errorMessage,
            field: rule.field,
            severity: rule.severity,
            suggestion: this.getSuggestion(rule, submission)
          });
        }
      }
      
      // File validation if files are present
      if (submission.files && submission.files.length > 0) {
        const fileValidation = await this.validateFiles(submission.files, submission.submissionType);
        errors.push(...fileValidation.errors);
        warnings.push(...fileValidation.warnings);
      }
      
      // Cross-reference validation
      const crossRefValidation = await this.validateCrossReferences(submission);
      errors.push(...crossRefValidation.errors);
      warnings.push(...crossRefValidation.warnings);
      
      // Business rule validation
      const businessValidation = await this.validateBusinessRules(submission);
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);
      
      const processingTime = Date.now() - startTime;
      
      return {
        isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
        errors,
        warnings,
        metadata: {
          validatedAt: new Date().toISOString(),
          validatedBy: 'ComplianceDataValidator',
          validationRules: appliedRules,
          dataSize: JSON.stringify(submission).length,
          processingTime
        }
      };
      
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'An error occurred during validation',
          severity: 'critical'
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date().toISOString(),
          validatedBy: 'ComplianceDataValidator',
          validationRules: appliedRules,
          dataSize: 0,
          processingTime: Date.now() - startTime
        }
      };
    }
  }
  
  public async validateFiles(files: File[], submissionType: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const allowedTypes = this.getAllowedFileTypes(submissionType);
    const maxFileSize = this.getMaxFileSize(submissionType);
    const maxTotalSize = maxFileSize * 5; // 5x single file size for total
    
    let totalSize = 0;
    
    for (const file of files) {
      totalSize += file.size;
      
      // File type validation
      if (!allowedTypes.includes(file.type)) {
        errors.push({
          code: 'INVALID_FILE_TYPE',
          message: `File type ${file.type} is not allowed for ${submissionType}`,
          field: `file.${file.name}`,
          severity: 'high',
          suggestion: `Allowed types: ${allowedTypes.join(', ')}`
        });
      }
      
      // File size validation
      if (file.size > maxFileSize) {
        errors.push({
          code: 'FILE_TOO_LARGE',
          message: `File ${file.name} exceeds maximum size limit`,
          field: `file.${file.name}`,
          severity: 'high',
          suggestion: `Maximum file size: ${this.formatFileSize(maxFileSize)}`
        });
      }
      
      // File name validation
      if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
        warnings.push({
          code: 'INVALID_FILENAME',
          message: `File name contains special characters: ${file.name}`,
          field: `file.${file.name}`,
          recommendation: 'Use only letters, numbers, dots, hyphens, and underscores'
        });
      }
      
      // Content validation for specific file types
      if (file.type === 'application/pdf') {
        const pdfValidation = await this.validatePDFFile(file);
        if (!pdfValidation.isValid) {
          errors.push(...pdfValidation.errors);
        }
      }
    }
    
    // Total size validation
    if (totalSize > maxTotalSize) {
      errors.push({
        code: 'TOTAL_SIZE_EXCEEDED',
        message: 'Total file size exceeds limit',
        severity: 'high',
        suggestion: `Maximum total size: ${this.formatFileSize(maxTotalSize)}`
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date().toISOString(),
        validatedBy: 'FileValidator',
        validationRules: ['file_type', 'file_size', 'file_name', 'total_size'],
        dataSize: totalSize,
        processingTime: 0
      }
    };
  }
  
  private async validateStructure(submission: ComplianceSubmissionData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Required fields validation
    if (!submission.userId) {
      errors.push({
        code: 'MISSING_USER_ID',
        message: 'User ID is required',
        field: 'userId',
        severity: 'critical'
      });
    }
    
    if (!submission.metricId) {
      errors.push({
        code: 'MISSING_METRIC_ID',
        message: 'Metric ID is required',
        field: 'metricId',
        severity: 'critical'
      });
    }
    
    if (!submission.submissionType) {
      errors.push({
        code: 'MISSING_SUBMISSION_TYPE',
        message: 'Submission type is required',
        field: 'submissionType',
        severity: 'critical'
      });
    }
    
    // Data structure validation
    if (!submission.data || typeof submission.data !== 'object') {
      errors.push({
        code: 'INVALID_DATA_STRUCTURE',
        message: 'Submission data must be a valid object',
        field: 'data',
        severity: 'high'
      });
    }
    
    return { isValid: errors.length === 0, errors, warnings, metadata: {} as ValidationMetadata };
  }
  
  private async applyValidationRule(rule: ValidationRule, submission: ComplianceSubmissionData): Promise<{ isValid: boolean }> {
    const value = this.getFieldValue(submission, rule.field || '');
    
    switch (rule.type) {
      case 'required':
        return { isValid: this.validateRequired(value) };
        
      case 'format':
        return { isValid: this.validateFormat(value, rule.condition) };
        
      case 'range':
        return { isValid: this.validateRange(value, rule.condition) };
        
      case 'custom':
        const customValidator = this.customValidators.get(rule.condition);
        if (customValidator) {
          const result = await customValidator(value, submission);
          return { isValid: result };
        }
        return { isValid: true };
        
      case 'business':
        return await this.validateBusinessRule(rule.condition, value, submission);
        
      default:
        return { isValid: true };
    }
  }
  
  private async validateCrossReferences(submission: ComplianceSubmissionData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // Validate user exists
      const userResult = await supabase
        .from('profiles')
        .select('id')
        .eq('id', submission.userId)
        .single();
      
      if (userResult.error || !userResult.data) {
        errors.push({
          code: 'INVALID_USER',
          message: 'User does not exist',
          field: 'userId',
          severity: 'critical'
        });
      }
      
      // Validate metric exists
      const metricResult = await supabase
        .from('compliance_metrics')
        .select('id, name')
        .eq('id', submission.metricId)
        .single();
      
      if (metricResult.error || !metricResult.data) {
        errors.push({
          code: 'INVALID_METRIC',
          message: 'Compliance metric does not exist',
          field: 'metricId',
          severity: 'critical'
        });
      }
      
      // Check for duplicate submissions
      const { data: existing } = await supabase
        .from('user_compliance_records')
        .select('id, compliance_status')
        .eq('user_id', submission.userId)
        .eq('metric_id', submission.metricId)
        .eq('compliance_status', 'compliant');
      
      if (existing && existing.length > 0) {
        warnings.push({
          code: 'DUPLICATE_SUBMISSION',
          message: 'User already has a compliant record for this metric',
          recommendation: 'Consider if this is an update or renewal'
        });
      }
      
    } catch (error) {
      console.error('Cross-reference validation error:', error);
    }
    
    return { isValid: errors.length === 0, errors, warnings, metadata: {} as ValidationMetadata };
  }
  
  private async validateBusinessRules(submission: ComplianceSubmissionData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Custom business rule validations based on submission type
    switch (submission.submissionType) {
      case 'certification':
        await this.validateCertificationBusinessRules(submission, errors, warnings);
        break;
        
      case 'training':
        await this.validateTrainingBusinessRules(submission, errors, warnings);
        break;
        
      case 'assessment':
        await this.validateAssessmentBusinessRules(submission, errors, warnings);
        break;
    }
    
    return { isValid: errors.length === 0, errors, warnings, metadata: {} as ValidationMetadata };
  }
  
  private async validateCertificationBusinessRules(
    submission: ComplianceSubmissionData, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ) {
    // Check if certification is from approved issuer
    if (submission.data.issuer) {
      const customValidator = this.customValidators.get('approvedIssuer');
      if (customValidator) {
        const isApproved = await customValidator(submission.data.issuer);
        if (!isApproved) {
          warnings.push({
            code: 'UNAPPROVED_ISSUER',
            message: 'Certificate issuer is not on the pre-approved list',
            field: 'data.issuer',
            recommendation: 'Manual review may be required'
          });
        }
      }
    }
    
    // Check expiry date reasonableness
    if (submission.data.expiryDate) {
      const expiryDate = new Date(submission.data.expiryDate);
      const now = new Date();
      const yearsFromNow = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      if (yearsFromNow > 10) {
        warnings.push({
          code: 'LONG_EXPIRY',
          message: 'Certificate has unusually long validity period',
          field: 'data.expiryDate',
          recommendation: 'Verify certificate validity period'
        });
      }
    }
  }
  
  private async validateTrainingBusinessRules(
    submission: ComplianceSubmissionData,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    // Validate training hours against metric requirements
    if (submission.data.hours) {
      try {
        const metricResult = await supabase
          .from('compliance_metrics')
          .select('id, name')
          .eq('id', submission.metricId)
          .single();
        
        // Mock required hours since the field doesn't exist in schema
        const requiredHours = 8; // Default requirement
        
        if (submission.data.hours < requiredHours) {
          errors.push({
            code: 'INSUFFICIENT_HOURS',
            message: `Training hours (${submission.data.hours}) below required minimum (${requiredHours})`,
            field: 'data.hours',
            severity: 'high',
            suggestion: `Complete at least ${requiredHours} hours of training`
          });
        }
      } catch (error) {
        console.error('Error validating training hours:', error);
      }
    }
  }
  
  private async validateAssessmentBusinessRules(
    submission: ComplianceSubmissionData, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ) {
    // Validate score against passing requirement
    if (submission.data.score !== undefined) {
      const customValidator = this.customValidators.get('passingScore');
      if (customValidator) {
        const isPassing = await customValidator(submission.data.score, submission);
        if (!isPassing) {
          errors.push({
            code: 'FAILING_SCORE',
            message: 'Assessment score does not meet minimum passing requirement',
            field: 'data.score',
            severity: 'high',
            suggestion: 'Retake assessment to achieve passing score'
          });
        }
      }
    }
  }
  
  private async validateBusinessRule(condition: string, value: any, submission: ComplianceSubmissionData): Promise<{ isValid: boolean }> {
    const customValidator = this.customValidators.get(condition);
    if (customValidator) {
      const result = await customValidator(value, submission);
      return { isValid: result };
    }
    return { isValid: true };
  }
  
  private validateRequired(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }
  
  private validateFormat(value: any, condition: string): boolean {
    if (!value) return false;
    
    if (condition.startsWith('regex:')) {
      const pattern = condition.substring(6);
      const regex = new RegExp(pattern);
      return regex.test(value.toString());
    }
    
    if (condition.startsWith('enum:')) {
      const options = condition.substring(5).split(',');
      return options.includes(value.toString());
    }
    
    return true;
  }
  
  private validateRange(value: any, condition: string): boolean {
    if (condition === 'futureDate') {
      const date = new Date(value);
      return date > new Date();
    }
    
    if (condition === 'pastDate') {
      const date = new Date(value);
      return date <= new Date();
    }
    
    if (condition.startsWith('range:')) {
      const [min, max] = condition.substring(6).split(',').map(Number);
      const numValue = Number(value);
      return numValue >= min && numValue <= max;
    }
    
    return true;
  }
  
  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  private getSuggestion(rule: ValidationRule, submission: ComplianceSubmissionData): string | undefined {
    switch (rule.id) {
      case 'cert_number_format':
        return 'Use format: ABC123XYZ (6-20 alphanumeric characters)';
      case 'training_hours_valid':
        return 'Enter hours as decimal (e.g., 8.5 for 8 hours 30 minutes)';
      case 'assessment_score_range':
        return 'Enter score as percentage (0-100)';
      default:
        return undefined;
    }
  }
  
  private getAllowedFileTypes(submissionType: string): string[] {
    const commonTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    switch (submissionType) {
      case 'certification':
        return [...commonTypes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      case 'training':
        return [...commonTypes, 'text/csv', 'application/vnd.ms-excel'];
      case 'document':
        return [
          ...commonTypes,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain'
        ];
      default:
        return commonTypes;
    }
  }
  
  private getMaxFileSize(submissionType: string): number {
    // Return size in bytes
    switch (submissionType) {
      case 'certification':
        return 10 * 1024 * 1024; // 10MB
      case 'training':
        return 5 * 1024 * 1024;  // 5MB
      case 'document':
        return 25 * 1024 * 1024; // 25MB
      default:
        return 5 * 1024 * 1024;  // 5MB
    }
  }
  
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  private async validatePDFFile(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Check PDF header
        const pdfHeader = uint8Array.slice(0, 4);
        const isPDF = String.fromCharCode(...pdfHeader) === '%PDF';
        
        if (!isPDF) {
          resolve({
            isValid: false,
            errors: [{
              code: 'INVALID_PDF',
              message: 'File is not a valid PDF document',
              field: `file.${file.name}`,
              severity: 'high'
            }],
            warnings: [],
            metadata: {} as ValidationMetadata
          });
        } else {
          resolve({
            isValid: true,
            errors: [],
            warnings: [],
            metadata: {} as ValidationMetadata
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          isValid: false,
          errors: [{
            code: 'FILE_READ_ERROR',
            message: 'Unable to read file content',
            field: `file.${file.name}`,
            severity: 'high'
          }],
          warnings: [],
          metadata: {} as ValidationMetadata
        });
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  public async addCustomValidationRule(submissionType: string, rule: ValidationRule): Promise<void> {
    const rules = this.validationRules.get(submissionType) || [];
    rules.push(rule);
    this.validationRules.set(submissionType, rules);
  }
  
  public async addCustomValidator(name: string, validator: Function): Promise<void> {
    this.customValidators.set(name, validator);
  }
  
  public getValidationRules(submissionType: string): ValidationRule[] {
    return this.validationRules.get(submissionType) || [];
  }
  
  public async validateBatch(submissions: ComplianceSubmissionData[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const submission of submissions) {
      const result = await this.validateSubmission(submission);
      results.push(result);
    }
    
    return results;
  }
}

// Export singleton instance
export const complianceDataValidator = ComplianceDataValidator.getInstance();