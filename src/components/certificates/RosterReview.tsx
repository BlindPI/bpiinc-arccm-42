
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface RosterReviewProps {
  data: any[];
  enableCourseMatching: boolean;
  selectedCourseId?: string;
  extractedCourse?: any;
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
  const [showDetails, setShowDetails] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  
  // Count course mismatches
  const courseMismatchCount = data.filter(row => row.hasCourseMismatch).length;
  const hasCourseMismatches = courseMismatchCount > 0;
  
  const displayData = showOnlyErrors 
    ? data.filter(row => row.validationErrors.length > 0)
    : data;

  return (
    <div className="space-y-4">
      {/* Critical Course Mismatch Alert */}
      {hasCourseMismatches && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">
                CRITICAL: {courseMismatchCount} Course Mismatch{courseMismatchCount !== 1 ? 'es' : ''} Detected
              </div>
              <div className="text-sm">
                Some rows specify certification combinations that don't match any available courses.
                <br />
                <strong>Common Issue:</strong> BLS/CPR-only courses do not include First Aid certification.
                <br />
                If your data specifies both First Aid AND CPR levels, you need a course that provides both.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Roster Summary</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                className="flex items-center gap-1"
              >
                {showOnlyErrors ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showOnlyErrors ? 'Show All' : 'Show Errors Only'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
              <div className="text-sm text-blue-700">Total Records</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalCount - errorCount}</div>
              <div className="text-sm text-green-700">Valid Records</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-red-700">Records with Errors</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{courseMismatchCount}</div>
              <div className="text-sm text-orange-700">Course Mismatches</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Row View */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayData.map((row, index) => (
                <div key={index} className={`p-3 border rounded-lg ${
                  row.validationErrors.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{row.recipientName || 'No Name'}</div>
                      <div className="text-sm text-gray-600">{row.email}</div>
                      {(row.firstAidLevel || row.cprLevel) && (
                        <div className="text-xs text-gray-500 mt-1">
                          Specified: {row.firstAidLevel && `First Aid: ${row.firstAidLevel}`}
                          {row.firstAidLevel && row.cprLevel && ' | '}
                          {row.cprLevel && `CPR: ${row.cprLevel}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {row.validationErrors.length === 0 ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {row.validationErrors.length} Error{row.validationErrors.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Course Match Information */}
                  {enableCourseMatching && row.courseMatch && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        {row.courseMatch.matchType === 'mismatch' ? (
                          <div className="flex items-start gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium">Course Mismatch</div>
                              <div className="text-xs">{row.courseMatch.mismatchReason}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Matched to: {row.courseMatch.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Error Details */}
                  {row.validationErrors.length > 0 && (
                    <Collapsible className="mt-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs text-red-600 p-0 h-auto">
                          Show Error Details
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="space-y-1">
                          {row.validationErrors.map((error: any, errorIndex: number) => (
                            <div key={errorIndex} className="text-xs text-red-600 bg-red-100 p-2 rounded">
                              <div className="font-medium">{error.message}</div>
                              {error.type === 'course_mismatch' && error.details && (
                                <div className="mt-1 text-xs">
                                  <div>You specified: 
                                    {error.details.specifiedFirstAid && ` First Aid: ${error.details.specifiedFirstAid}`}
                                    {error.details.specifiedFirstAid && error.details.specifiedCpr && ' | '}
                                    {error.details.specifiedCpr && ` CPR: ${error.details.specifiedCpr}`}
                                  </div>
                                  <div className="mt-1">Available courses (sample):</div>
                                  <ul className="ml-2 text-xs">
                                    {error.details.availableCourses.slice(0, 3).map((course: any, i: number) => (
                                      <li key={i}>
                                        • {course.name}: 
                                        {course.firstAid && ` First Aid: ${course.firstAid}`}
                                        {course.firstAid && course.cpr && ' | '}
                                        {course.cpr && ` CPR: ${course.cpr}`}
                                        {!course.firstAid && !course.cpr && ' (No First Aid/CPR levels)'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
