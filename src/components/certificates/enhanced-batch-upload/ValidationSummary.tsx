
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { BatchValidationResult } from '@/types/certificateValidation';

interface ValidationSummaryProps {
  result: BatchValidationResult;
}

export function ValidationSummary({ result }: ValidationSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {result.isValid ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          Validation Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg ${
          result.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${result.isValid ? 'text-green-800' : 'text-red-800'}`}>
                {result.isValid ? 'All records are valid' : 'Validation errors found'}
              </p>
              <p className="text-sm text-gray-600">
                {result.validRecords} of {result.totalRecords} records are valid
              </p>
            </div>
            <Badge variant={result.isValid ? 'default' : 'destructive'}>
              {Math.round((result.validRecords / result.totalRecords) * 100)}% Valid
            </Badge>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{result.validRecords}</p>
            <p className="text-sm text-gray-600">Valid Records</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{result.totalRecords - result.validRecords}</p>
            <p className="text-sm text-gray-600">Invalid Records</p>
          </div>
        </div>

        {/* Errors */}
        {result.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">{result.errors.length} validation error(s) found:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="text-sm">
                      {error.field}: {error.message}
                    </li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-sm font-medium">
                      ...and {result.errors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">{result.warnings.length} warning(s):</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {result.isValid && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All records passed validation! You can proceed with the submission.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
