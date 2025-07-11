
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ScoreStatusBadge,
  CompactStatusIndicator,
  ScoreProgressBar,
  ScoreBreakdown,
  ScoreSummaryIndicator,
  CompletionDateDisplay,
  CompletionIndicator,
  type CertificateCalculatedStatus
} from '@/components/certificates/score-indicators';
import { EnhancedCertificateRequest, determinePassFailStatus, calculateWeightedScore } from '@/types/supabase-schema';

interface RosterReviewProps {
  data: EnhancedCertificateRequest[];
  enableCourseMatching: boolean;
  selectedCourseId?: string;
  extractedCourse?: any;
  totalCount: number;
  errorCount: number;
  showScoreDetails?: boolean;
  enableScoreFiltering?: boolean;
}

type FilterType = 'all' | 'errors' | 'score_pending' | 'score_complete' | 'pass' | 'fail' | 'review_needed';

export function RosterReview({
  data,
  enableCourseMatching,
  selectedCourseId,
  extractedCourse,
  totalCount,
  errorCount,
  showScoreDetails = true,
  enableScoreFiltering = true
}: RosterReviewProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [expandedScores, setExpandedScores] = useState<Set<string>>(new Set());
  
  // Count course mismatches and score statistics
  const courseMismatchCount = data.filter(row => row.hasCourseMismatch).length;
  const hasCourseMismatches = courseMismatchCount > 0;
  
  // Score-based statistics
  const scoreStats = data.reduce((acc, row) => {
    const hasScores = (row.practical_score !== null && row.practical_score !== undefined) ||
                     (row.written_score !== null && row.written_score !== undefined);
    const passFailStatus = determinePassFailStatus(
      row.practical_score || undefined,
      row.written_score || undefined,
      row.pass_threshold || 80,
      row.requires_both_scores || true
    );
    
    if (hasScores) acc.withScores++;
    if (passFailStatus === 'AUTO_PASS') acc.passed++;
    if (passFailStatus === 'AUTO_FAIL') acc.failed++;
    if (passFailStatus === 'MANUAL_REVIEW') acc.needsReview++;
    if (passFailStatus === 'PENDING_SCORES') acc.pendingScores++;
    
    return acc;
  }, { withScores: 0, passed: 0, failed: 0, needsReview: 0, pendingScores: 0 });
  
  // Filter data based on selected filter
  const getFilteredData = () => {
    switch (filterType) {
      case 'errors':
        return data.filter(row => row.validationErrors.length > 0);
      case 'score_pending':
        return data.filter(row => determinePassFailStatus(
          row.practical_score || undefined,
          row.written_score || undefined,
          row.pass_threshold || 80
        ) === 'PENDING_SCORES');
      case 'score_complete':
        return data.filter(row => {
          const status = determinePassFailStatus(
            row.practical_score || undefined,
            row.written_score || undefined,
            row.pass_threshold || 80
          );
          return status !== 'PENDING_SCORES';
        });
      case 'pass':
        return data.filter(row => determinePassFailStatus(
          row.practical_score || undefined,
          row.written_score || undefined,
          row.pass_threshold || 80
        ) === 'AUTO_PASS');
      case 'fail':
        return data.filter(row => determinePassFailStatus(
          row.practical_score || undefined,
          row.written_score || undefined,
          row.pass_threshold || 80
        ) === 'AUTO_FAIL');
      case 'review_needed':
        return data.filter(row => determinePassFailStatus(
          row.practical_score || undefined,
          row.written_score || undefined,
          row.pass_threshold || 80
        ) === 'MANUAL_REVIEW');
      default:
        return data;
    }
  };
  
  const displayData = getFilteredData();
  
  const toggleScoreExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedScores);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedScores(newExpanded);
  };

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
              {enableScoreFiltering && (
                <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter records..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="errors">Errors Only</SelectItem>
                    <SelectItem value="score_pending">Pending Scores</SelectItem>
                    <SelectItem value="score_complete">Scores Complete</SelectItem>
                    <SelectItem value="pass">Passed</SelectItem>
                    <SelectItem value="fail">Failed</SelectItem>
                    <SelectItem value="review_needed">Needs Review</SelectItem>
                  </SelectContent>
                </Select>
              )}
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
          {/* Basic Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

          {/* Enhanced Score Statistics */}
          {showScoreDetails && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">Score Analysis</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{scoreStats.withScores}</div>
                  <div className="text-xs text-purple-700">With Scores</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{scoreStats.passed}</div>
                  <div className="text-xs text-green-700">Auto Pass</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">{scoreStats.failed}</div>
                  <div className="text-xs text-red-700">Auto Fail</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">{scoreStats.needsReview}</div>
                  <div className="text-xs text-yellow-700">Review Needed</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-600">{scoreStats.pendingScores}</div>
                  <div className="text-xs text-gray-700">Pending Scores</div>
                </div>
              </div>
            </div>
          )}
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
              {displayData.map((row, index) => {
                const rowId = row.id || `row-${index}`;
                const isExpanded = expandedScores.has(rowId);
                const passFailStatus = determinePassFailStatus(
                  row.practical_score || undefined,
                  row.written_score || undefined,
                  row.pass_threshold || 80,
                  row.requires_both_scores || true
                );
                const hasScores = (row.practical_score !== null && row.practical_score !== undefined) ||
                                 (row.written_score !== null && row.written_score !== undefined);

                return (
                  <div key={index} className={`p-4 border rounded-lg ${
                    row.validationErrors.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">
                          {row.recipient_name ||
                           row.name ||
                           row.full_name ||
                           (row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : null) ||
                           row.student_name ||
                           row.participant_name ||
                           'No Name'}
                        </div>
                        <div className="text-sm text-gray-600">{row.email || row.recipient_email || row.student_email}</div>
                        {(row.first_aid_level || row.cpr_level) && (
                          <div className="text-xs text-gray-500 mt-1">
                            Specified: {row.first_aid_level && `First Aid: ${row.first_aid_level}`}
                            {row.first_aid_level && row.cpr_level && ' | '}
                            {row.cpr_level && `CPR: ${row.cpr_level}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Enhanced Score Status Indicator */}
                        {hasScores && (
                          <ScoreStatusBadge
                            status={passFailStatus}
                            size="sm"
                          />
                        )}
                        
                        {/* Validation Status */}
                        {row.validationErrors.length === 0 ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                            <CheckCircle className="h-3 w-3" />
                            Valid
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs">
                            <XCircle className="h-3 w-3" />
                            {row.validationErrors.length} Error{row.validationErrors.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Score Display Section */}
                    {hasScores && showScoreDetails && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium">Score Details</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleScoreExpansion(rowId)}
                            className="h-6 px-2 text-xs"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-3 w-3 mr-1" />
                                Show
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {/* Compact Score Summary */}
                        <ScoreSummaryIndicator
                          totalScore={row.total_score}
                          threshold={row.pass_threshold || 80}
                          size="sm"
                        />
                        
                        {/* Expandable Detailed Score Breakdown */}
                        {isExpanded && (
                          <div className="mt-3 space-y-3">
                            <ScoreBreakdown
                              practicalScore={row.practical_score}
                              writtenScore={row.written_score}
                              totalScore={row.total_score}
                              thresholds={{
                                passThreshold: row.pass_threshold || 80,
                                conditionalMin: (row.pass_threshold || 80) * 0.8,
                                requiresBothScores: row.requires_both_scores || true,
                                practicalWeight: row.practical_weight || 0.5,
                                writtenWeight: row.written_weight || 0.5
                              }}
                              variant="compact"
                              size="sm"
                            />
                            
                            {/* Completion Date Information */}
                            {(row.completion_date || row.online_completion_date || row.practical_completion_date) && (
                              <div className="pt-2 border-t border-gray-100">
                                <CompletionDateDisplay
                                  completionDate={row.completion_date}
                                  onlineCompletionDate={row.online_completion_date}
                                  practicalCompletionDate={row.practical_completion_date}
                                  variant="detailed"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Course Match Information */}
                    {enableCourseMatching && (row as any).courseMatch && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          {(row as any).courseMatch.matchType === 'mismatch' ? (
                            <div className="flex items-start gap-2 text-red-600">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium">Course Mismatch</div>
                                <div className="text-xs">{(row as any).courseMatch.mismatchReason}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>Matched to: {(row as any).courseMatch.name}</span>
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
              );
            })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
