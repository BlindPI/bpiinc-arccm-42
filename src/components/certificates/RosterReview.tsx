
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { CourseMatchDisplay } from './batch-upload/CourseMatchDisplay';

interface RosterReviewProps {
  data: any[];
  enableCourseMatching: boolean;
  selectedCourseId: string;
  extractedCourse: any;
  totalCount: number;
  errorCount: number;
}

export function RosterReview({ 
  data, 
  enableCourseMatching, 
  selectedCourseId, 
  extractedCourse,
  totalCount,
  errorCount 
}: RosterReviewProps) {
  const validRecords = data.filter(record => !record.validationErrors || record.validationErrors.length === 0);
  
  return (
    <div className="space-y-4">
      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorCount} records have validation errors and will be skipped during submission.
          </AlertDescription>
        </Alert>
      )}

      {enableCourseMatching && extractedCourse && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Extracted Course Information</h4>
          <CourseMatchDisplay 
            extractedCourse={extractedCourse}
            courseMatch={data[0]?.courseMatch}
          />
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Roster Preview ({validRecords.length} of {totalCount} valid)
            </h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {validRecords.length} Valid
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  {errorCount} Errors
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((record, index) => (
                <TableRow key={record.id || index}>
                  <TableCell className="font-medium">
                    {record.recipientName || 'Missing Name'}
                  </TableCell>
                  <TableCell>{record.email || 'Missing Email'}</TableCell>
                  <TableCell>{record.issueDate}</TableCell>
                  <TableCell>
                    {record.validationErrors && record.validationErrors.length > 0 ? (
                      <Badge variant="destructive">Invalid</Badge>
                    ) : (
                      <Badge variant="success">Valid</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.validationErrors && record.validationErrors.length > 0 && (
                      <div className="text-xs text-red-600">
                        {record.validationErrors.join(', ')}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {data.length > 10 && (
            <div className="p-3 text-center text-sm text-muted-foreground border-t">
              Showing first 10 of {data.length} records
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
