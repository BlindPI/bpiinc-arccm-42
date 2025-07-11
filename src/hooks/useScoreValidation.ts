/**
 * Score Validation Hook
 * 
 * React hook for real-time score validation and threshold checking.
 * Provides automatic pass/fail status calculation, error detection,
 * and validation messaging for certificate review workflows.
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  determinePassFailStatus,
  calculateWeightedScore,
  type CertificateCalculatedStatus,
  type ScoreThresholds 
} from '@/types/supabase-schema';

export interface ScoreValidationConfig {
  passThreshold: number;
  practicalWeight: number;
  writtenWeight: number;
  requiresBothScores: boolean;
  conditionalPassEnabled?: boolean;
  conditionalThreshold?: number;
}

export interface ScoreValidationResult {
  status: CertificateCalculatedStatus;
  isValid: boolean;
  totalScore?: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  type: 'missing_scores' | 'invalid_range' | 'threshold_not_met' | 'calculation_error';
  message: string;
  field?: 'practical' | 'written' | 'threshold';
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  type: 'approaching_threshold' | 'missing_optional' | 'data_mismatch';
  message: string;
  field?: string;
}

export interface UseScoreValidationProps {
  practicalScore?: number | null;
  writtenScore?: number | null;
  config: ScoreValidationConfig;
  realTimeValidation?: boolean;
  debounceMs?: number;
}

/**
 * Hook for real-time score validation and status calculation
 */
export function useScoreValidation({
  practicalScore,
  writtenScore,
  config,
  realTimeValidation = true,
  debounceMs = 300
}: UseScoreValidationProps) {
  const [validationResult, setValidationResult] = useState<ScoreValidationResult>({
    status: 'PENDING_SCORES',
    isValid: false,
    errors: [],
    warnings: [],
    suggestions: []
  });

  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation function
  useEffect(() => {
    if (!realTimeValidation) return;

    setIsValidating(true);
    const timer = setTimeout(() => {
      const result = validateScores();
      setValidationResult(result);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [practicalScore, writtenScore, config, realTimeValidation, debounceMs]);

  // Memoized validation logic
  const validateScores = useMemo(() => {
    return (): ScoreValidationResult => {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      const suggestions: string[] = [];

      // Validate score ranges
      if (practicalScore !== null && practicalScore !== undefined) {
        if (practicalScore < 0 || practicalScore > 100) {
          errors.push({
            type: 'invalid_range',
            message: 'Practical score must be between 0 and 100',
            field: 'practical',
            severity: 'error'
          });
        }
      }

      if (writtenScore !== null && writtenScore !== undefined) {
        if (writtenScore < 0 || writtenScore > 100) {
          errors.push({
            type: 'invalid_range',
            message: 'Written score must be between 0 and 100',
            field: 'written',
            severity: 'error'
          });
        }
      }

      // Validate threshold
      if (config.passThreshold < 0 || config.passThreshold > 100) {
        errors.push({
          type: 'invalid_range',
          message: 'Pass threshold must be between 0 and 100',
          field: 'threshold',
          severity: 'error'
        });
      }

      // If there are range errors, return early
      if (errors.length > 0) {
        return {
          status: 'PENDING_SCORES',
          isValid: false,
          errors,
          warnings,
          suggestions
        };
      }

      // Calculate status using business logic
      const status = determinePassFailStatus(
        practicalScore || undefined,
        writtenScore || undefined,
        config.passThreshold,
        config.requiresBothScores
      );

      // Calculate weighted total score if both scores are available
      let totalScore: number | undefined;
      if (practicalScore !== null && practicalScore !== undefined && 
          writtenScore !== null && writtenScore !== undefined) {
        try {
          totalScore = calculateWeightedScore(
            practicalScore,
            writtenScore,
            config.practicalWeight
          );
        } catch (error) {
          errors.push({
            type: 'calculation_error',
            message: 'Error calculating weighted score',
            severity: 'error'
          });
        }
      }

      // Check for missing scores
      if (!practicalScore && !writtenScore) {
        warnings.push({
          type: 'missing_optional',
          message: 'No scores recorded yet',
          field: 'scores'
        });
        suggestions.push('Import scores from Thinkific or enter manually');
      } else if (config.requiresBothScores) {
        if (!practicalScore) {
          warnings.push({
            type: 'missing_optional',
            message: 'Practical score missing (required for final determination)',
            field: 'practical'
          });
          suggestions.push('Enter practical assessment score');
        }
        if (!writtenScore) {
          warnings.push({
            type: 'missing_optional',
            message: 'Written score missing (required for final determination)',
            field: 'written'
          });
          suggestions.push('Enter written assessment score');
        }
      }

      // Check for scores approaching threshold
      const threshold = config.passThreshold;
      const warningRange = 5; // Warn if within 5 points of threshold

      if (practicalScore !== null && practicalScore !== undefined) {
        if (practicalScore >= threshold - warningRange && practicalScore < threshold) {
          warnings.push({
            type: 'approaching_threshold',
            message: `Practical score (${practicalScore}%) is close to threshold (${threshold}%)`,
            field: 'practical'
          });
        }
      }

      if (writtenScore !== null && writtenScore !== undefined) {
        if (writtenScore >= threshold - warningRange && writtenScore < threshold) {
          warnings.push({
            type: 'approaching_threshold',
            message: `Written score (${writtenScore}%) is close to threshold (${threshold}%)`,
            field: 'written'
          });
        }
      }

      // Generate suggestions based on status
      switch (status) {
        case 'AUTO_FAIL':
          if (totalScore && totalScore < threshold) {
            suggestions.push(`Score needs to improve by ${Math.ceil(threshold - totalScore)} points to pass`);
          }
          suggestions.push('Consider remedial training or re-assessment');
          break;
        
        case 'MANUAL_REVIEW':
          suggestions.push('Manual review required - scores meet some but not all criteria');
          if (config.requiresBothScores) {
            suggestions.push('Both practical and written scores should meet minimum requirements');
          }
          break;
        
        case 'PENDING_SCORES':
          suggestions.push('Awaiting score completion');
          break;
        
        case 'AUTO_PASS':
          // No suggestions needed for pass
          break;
      }

      const isValid = errors.length === 0;

      return {
        status,
        isValid,
        totalScore,
        errors,
        warnings,
        suggestions
      };
    };
  }, [practicalScore, writtenScore, config]);

  // Manual validation trigger
  const validateNow = () => {
    setIsValidating(true);
    const result = validateScores();
    setValidationResult(result);
    setIsValidating(false);
    return result;
  };

  // Get status color for UI display
  const getStatusColor = () => {
    switch (validationResult.status) {
      case 'AUTO_PASS':
        return 'green';
      case 'AUTO_FAIL':
        return 'red';
      case 'MANUAL_REVIEW':
        return 'yellow';
      case 'PENDING_SCORES':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Get status display text
  const getStatusText = () => {
    switch (validationResult.status) {
      case 'AUTO_PASS':
        return 'Passed';
      case 'AUTO_FAIL':
        return 'Failed';
      case 'MANUAL_REVIEW':
        return 'Needs Review';
      case 'PENDING_SCORES':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  // Check if scores are complete
  const isScoreComplete = () => {
    if (config.requiresBothScores) {
      return practicalScore !== null && practicalScore !== undefined &&
             writtenScore !== null && writtenScore !== undefined;
    }
    return (practicalScore !== null && practicalScore !== undefined) ||
           (writtenScore !== null && writtenScore !== undefined);
  };

  // Get completion percentage
  const getCompletionPercentage = () => {
    if (config.requiresBothScores) {
      let completed = 0;
      if (practicalScore !== null && practicalScore !== undefined) completed += 50;
      if (writtenScore !== null && writtenScore !== undefined) completed += 50;
      return completed;
    } else {
      return (practicalScore !== null && practicalScore !== undefined) ||
             (writtenScore !== null && writtenScore !== undefined) ? 100 : 0;
    }
  };

  // Initial validation on mount
  useEffect(() => {
    if (!realTimeValidation) {
      const result = validateScores();
      setValidationResult(result);
    }
  }, [validateScores, realTimeValidation]);

  return {
    // Validation results
    ...validationResult,
    
    // Status helpers
    isValidating,
    isScoreComplete: isScoreComplete(),
    completionPercentage: getCompletionPercentage(),
    statusColor: getStatusColor(),
    statusText: getStatusText(),
    
    // Actions
    validateNow,
    
    // Computed values
    hasErrors: validationResult.errors.length > 0,
    hasWarnings: validationResult.warnings.length > 0,
    hasSuggestions: validationResult.suggestions.length > 0,
    
    // Individual score status
    practicalStatus: practicalScore !== null && practicalScore !== undefined ? 
      (practicalScore >= config.passThreshold ? 'pass' : 'fail') : 'pending',
    writtenStatus: writtenScore !== null && writtenScore !== undefined ? 
      (writtenScore >= config.passThreshold ? 'pass' : 'fail') : 'pending',
  };
}

/**
 * Simplified hook for batch validation of multiple certificate requests
 */
export function useBatchScoreValidation(
  requests: Array<{
    id: string;
    practicalScore?: number | null;
    writtenScore?: number | null;
    passThreshold?: number;
    requiresBothScores?: boolean;
  }>,
  defaultConfig: Partial<ScoreValidationConfig> = {}
) {
  const [validationResults, setValidationResults] = useState<Map<string, ScoreValidationResult>>(new Map());

  useEffect(() => {
    const results = new Map<string, ScoreValidationResult>();
    
    requests.forEach(request => {
      const config: ScoreValidationConfig = {
        passThreshold: request.passThreshold || defaultConfig.passThreshold || 80,
        practicalWeight: defaultConfig.practicalWeight || 0.5,
        writtenWeight: defaultConfig.writtenWeight || 0.5,
        requiresBothScores: request.requiresBothScores ?? defaultConfig.requiresBothScores ?? true
      };

      const { validateScores } = useScoreValidation({
        practicalScore: request.practicalScore,
        writtenScore: request.writtenScore,
        config,
        realTimeValidation: false
      });

      results.set(request.id, validateScores());
    });

    setValidationResults(results);
  }, [requests, defaultConfig]);

  // Get summary statistics
  const summary = useMemo(() => {
    const stats = {
      total: requests.length,
      passed: 0,
      failed: 0,
      needsReview: 0,
      pending: 0,
      withErrors: 0,
      withWarnings: 0
    };

    validationResults.forEach(result => {
      switch (result.status) {
        case 'AUTO_PASS':
          stats.passed++;
          break;
        case 'AUTO_FAIL':
          stats.failed++;
          break;
        case 'MANUAL_REVIEW':
          stats.needsReview++;
          break;
        case 'PENDING_SCORES':
          stats.pending++;
          break;
      }

      if (result.errors.length > 0) stats.withErrors++;
      if (result.warnings.length > 0) stats.withWarnings++;
    });

    return stats;
  }, [validationResults, requests.length]);

  return {
    validationResults,
    summary,
    getResultForRequest: (id: string) => validationResults.get(id),
    hasValidationIssues: summary.withErrors > 0 || summary.withWarnings > 0
  };
}