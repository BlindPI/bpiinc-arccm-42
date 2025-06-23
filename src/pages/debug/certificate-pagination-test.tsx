import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Database, Filter, Users } from 'lucide-react';
import { diagnoseCertificatePagination, logCertificatePaginationDiagnostic, type CertificatePaginationDiagnostic } from '@/utils/diagnoseCertificatePagination';
import { useProfile } from '@/hooks/useProfile';

export default function CertificatePaginationTest() {
  const { data: profile } = useProfile();
  const [diagnostic, setDiagnostic] = useState<CertificatePaginationDiagnostic | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      console.log('🔍 Running Certificate Pagination Diagnostic...');
      const result = await diagnoseCertificatePagination(profile?.id);
      logCertificatePaginationDiagnostic(result);
      setDiagnostic(result);
    } catch (err) {
      console.error('❌ Diagnostic failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const getSeverityColor = (issue: string) => {
    if (issue.includes('CRITICAL')) return 'bg-red-100 text-red-800 border-red-200';
    if (issue.includes('MAJOR')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (issue.includes('MODERATE')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getIssues = (diagnostic: CertificatePaginationDiagnostic) => {
    const issues: string[] = [];
    
    if (diagnostic.queryPerformance.allRecordsTime > 100) {
      issues.push('CRITICAL: Query performance is poor - fetching all records takes too long');
    }
    
    if (diagnostic.totalRecords > 50) {
      issues.push('CRITICAL: No pagination implemented - loading too many records at once');
    }
    
    if (diagnostic.filteringAnalysis.clientSideFilterTime > 10) {
      issues.push('MAJOR: Client-side filtering is inefficient - should be server-side');
    }
    
    if (diagnostic.sortingCapabilities.missingSorting.length > 5) {
      issues.push('MAJOR: Missing essential sorting options for user experience');
    }
    
    if (diagnostic.groupingAnalysis.byUser > 10 || diagnostic.groupingAnalysis.byLocation > 5) {
      issues.push('MODERATE: Data organization could benefit from grouping features');
    }
    
    return issues;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificate Pagination Diagnostic</h1>
          <p className="text-gray-600 mt-2">
            Analyze certificate page performance and identify pagination/sorting issues
          </p>
        </div>
        
        <Button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Run Diagnostic
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Diagnostic Failed:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {diagnostic && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnostic.totalRecords}</div>
                <p className="text-xs text-gray-500">certificates in database</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Query Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnostic.queryPerformance.improvement}</div>
                <p className="text-xs text-gray-500">with pagination</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pages Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnostic.paginationNeeds.totalPagesNeeded}</div>
                <p className="text-xs text-gray-500">at 20 per page</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Memory Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnostic.paginationNeeds.memoryImpact}</div>
                <p className="text-xs text-gray-500">with pagination</p>
              </CardContent>
            </Card>
          </div>

          {/* Issues Identified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Issues Identified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getIssues(diagnostic).map((issue, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(issue)}`}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{issue}</span>
                    </div>
                  </div>
                ))}
                {getIssues(diagnostic).length === 0 && (
                  <div className="flex items-center gap-2 text-green-800 bg-green-50 p-3 rounded-lg border border-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">No critical issues identified</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Query Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">All Records Query:</span>
                  <Badge variant="outline">{diagnostic.queryPerformance.allRecordsTime}ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paginated Query (20):</span>
                  <Badge variant="outline">{diagnostic.queryPerformance.paginatedTime}ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Performance Improvement:</span>
                  <Badge variant="default">{diagnostic.queryPerformance.improvement}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtering Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Client-Side Filtering:</span>
                  <Badge variant="outline">{diagnostic.filteringAnalysis.clientSideFilterTime}ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Server-Side Filtering:</span>
                  <Badge variant="outline">{diagnostic.filteringAnalysis.serverSideFilterTime}ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Filter Improvement:</span>
                  <Badge variant="default">{diagnostic.filteringAnalysis.improvement}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grouping Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Data Organization Potential
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{diagnostic.groupingAnalysis.byUser}</div>
                  <div className="text-xs text-gray-600">Unique Users</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{diagnostic.groupingAnalysis.byLocation}</div>
                  <div className="text-xs text-gray-600">Unique Locations</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{diagnostic.groupingAnalysis.byDate}</div>
                  <div className="text-xs text-gray-600">Unique Dates</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{diagnostic.groupingAnalysis.byBatchId}</div>
                  <div className="text-xs text-gray-600">Unique Batches</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sorting Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Sorting Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Current Sorting:</h4>
                  <div className="flex flex-wrap gap-2">
                    {diagnostic.sortingCapabilities.currentSorting.map((sort, index) => (
                      <Badge key={index} variant="default">{sort}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Missing Sorting Options:</h4>
                  <div className="flex flex-wrap gap-2">
                    {diagnostic.sortingCapabilities.missingSorting.map((sort, index) => (
                      <Badge key={index} variant="outline">{sort}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}