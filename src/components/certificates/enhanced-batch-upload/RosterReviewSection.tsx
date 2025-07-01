
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react';
import { BatchValidationResult } from '@/types/certificateValidation';

interface RosterReviewSectionProps {
  data: any[];
  validationResult: BatchValidationResult;
}

export function RosterReviewSection({ data, validationResult }: RosterReviewSectionProps) {
  const validRecords = data.filter(record => !record.validationErrors?.length);
  const invalidRecords = data.filter(record => record.validationErrors?.length > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{validRecords.length}</p>
                <p className="text-sm text-gray-600">Valid Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{invalidRecords.length}</p>
                <p className="text-sm text-gray-600">Invalid Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{data.length}</p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Summary */}
      {invalidRecords.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {invalidRecords.length} record(s) have validation errors that need to be addressed before submission.
          </AlertDescription>
        </Alert>
      )}

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roster Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.map((record, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  record.validationErrors?.length > 0 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {record.validationErrors?.length > 0 ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">{record.recipientName || 'No Name'}</p>
                      <p className="text-sm text-gray-600">{record.email || 'No Email'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={record.assessmentStatus === 'PASS' ? 'default' : 'destructive'}>
                      {record.assessmentStatus}
                    </Badge>
                    {record.validationErrors?.length > 0 && (
                      <Badge variant="destructive">
                        {record.validationErrors.length} Error(s)
                      </Badge>
                    )}
                  </div>
                </div>
                
                {record.validationErrors?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {record.validationErrors.map((error: any, errorIndex: number) => (
                      <p key={errorIndex} className="text-xs text-red-600">
                        • {error.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
