
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceService } from '@/services/compliance/complianceService';
import { CreateComplianceMetricDialog } from './compliance/CreateComplianceMetricDialog';
import { UpdateComplianceRecordDialog } from './compliance/UpdateComplianceRecordDialog';
import { AssignComplianceMetricDialog } from './compliance/AssignComplianceMetricDialog';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';

export function ProviderComplianceManagement() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceData, setComplianceData] = useState({
    metrics: [],
    allRecords: [],
    summary: null,
    loading: true,
    error: null
  });

  // Initialize isAdmin after profile is loaded to prevent initialization errors
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Load real compliance data
  const loadComplianceData = async () => {
    if (!isAdmin || !profile) return;

    setComplianceData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load all compliance data
      const [metrics, allRecords] = await Promise.all([
        ComplianceService.getComplianceMetrics(),
        ComplianceService.getAllComplianceRecords()
      ]);

      // Calculate summary statistics from real data
      const totalProviders = new Set(allRecords.map(r => r.user_id)).size;
      const compliantCount = allRecords.filter(r => r.compliance_status === 'compliant').length;
      const pendingCount = allRecords.filter(r => r.compliance_status === 'pending').length;
      const nonCompliantCount = allRecords.filter(r => r.compliance_status === 'non_compliant').length;
      
      // Calculate overall score
      const totalRecords = allRecords.length;
      const overallScore = totalRecords > 0
        ? Math.round((compliantCount / totalRecords) * 100)
        : 0;

      setComplianceData({
        metrics,
        allRecords,
        summary: {
          totalProviders,
          compliantCount,
          pendingCount,
          nonCompliantCount,
          overallScore
        },
        loading: false,
        error: null
      });

      console.log('✅ Loaded real compliance data:', {
        metrics: metrics.length,
        records: allRecords.length,
        providers: totalProviders
      });

    } catch (error) {
      console.error('❌ Error loading compliance data:', error);
      setComplianceData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    loadComplianceData();
  }, [profile, isAdmin]);

  if (profileLoading || complianceData.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (complianceData.error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium mb-2">Error Loading Compliance Data</h3>
        <p className="text-muted-foreground">{complianceData.error}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">You don't have permission to access compliance management features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Provider Compliance Management</h2>
          <p className="text-muted-foreground">Monitor and manage compliance across authorized providers</p>
        </div>
        <div className="flex items-center gap-2">
          <CreateComplianceMetricDialog onMetricCreated={loadComplianceData} />
          <AssignComplianceMetricDialog onAssignmentCreated={loadComplianceData} />
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance Officer
          </Badge>
        </div>
      </div>

      {/* Compliance Overview Cards - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliant Records</p>
                <p className="text-2xl font-bold text-green-600">{complianceData.summary?.compliantCount || 0}</p>
                <p className="text-xs text-muted-foreground">out of {complianceData.allRecords.length} total</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold text-yellow-600">{complianceData.summary?.pendingCount || 0}</p>
                <p className="text-xs text-muted-foreground">require attention</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-600">{complianceData.summary?.nonCompliantCount || 0}</p>
                <p className="text-xs text-muted-foreground">need remediation</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className="text-2xl font-bold text-blue-600">{complianceData.summary?.overallScore || 0}%</p>
                <p className="text-xs text-muted-foreground">system average</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="audits">Audits</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-6">
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compliance Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Compliance Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {complianceData.metrics.length > 0 ? (
                        // Group metrics by category and calculate compliance percentages
                        Object.entries(
                          complianceData.metrics.reduce((acc, metric) => {
                            if (!acc[metric.category]) acc[metric.category] = [];
                            acc[metric.category].push(metric);
                            return acc;
                          }, {} as Record<string, typeof complianceData.metrics>)
                        ).slice(0, 4).map(([category, metrics]) => {
                          const categoryRecords = complianceData.allRecords.filter((record: any) =>
                            Array.isArray(metrics) && metrics.some((m: any) => m.id === record.metric_id)
                          );
                          const compliantRecords = categoryRecords.filter(r => r.compliance_status === 'compliant');
                          const percentage = categoryRecords.length > 0
                            ? Math.round((compliantRecords.length / categoryRecords.length) * 100)
                            : 0;

                          return (
                            <div key={category}>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="capitalize">{category}</span>
                                <span>{percentage}%</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No compliance metrics available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {complianceData.allRecords.length > 0 ? (
                        // Show recent compliance record updates
                        complianceData.allRecords
                          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                          .slice(0, 3)
                          .map((record, index) => {
                            const getStatusIcon = (status: string) => {
                              switch (status) {
                                case 'compliant':
                                  return <CheckCircle className="h-4 w-4 text-green-600" />;
                                case 'pending':
                                  return <Clock className="h-4 w-4 text-yellow-600" />;
                                case 'non_compliant':
                                  return <AlertTriangle className="h-4 w-4 text-red-600" />;
                                default:
                                  return <Clock className="h-4 w-4 text-gray-600" />;
                              }
                            };

                            const metric = complianceData.metrics.find(m => m.id === record.metric_id);
                            const timeAgo = new Date(record.updated_at).toLocaleDateString();

                            return (
                              <div key={record.id} className="flex items-center gap-3 p-2 border rounded">
                                {getStatusIcon(record.compliance_status)}
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {metric?.name || 'Unknown Metric'} - {record.compliance_status}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Updated {timeAgo}</p>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No recent compliance activities
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audits" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Compliance Audit Management</h3>
                <AssignComplianceMetricDialog onAssignmentCreated={loadComplianceData} />
              </div>
              
              <div className="grid gap-4">
                {complianceData.allRecords.length > 0 ? (
                  complianceData.allRecords.map((record) => {
                    const metric = complianceData.metrics.find(m => m.id === record.metric_id);
                    return (
                      <Card key={record.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{metric?.name || 'Unknown Metric'}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{metric?.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  Status:
                                  <Badge variant={
                                    record.compliance_status === 'compliant' ? 'default' :
                                    record.compliance_status === 'pending' ? 'secondary' :
                                    'destructive'
                                  }>
                                    {record.compliance_status}
                                  </Badge>
                                </span>
                                <span>Last Checked: {new Date(record.last_checked_at || record.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {metric && (
                              <UpdateComplianceRecordDialog
                                record={record}
                                metric={metric}
                                onRecordUpdated={loadComplianceData}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Audit Records</h3>
                    <p className="text-muted-foreground mb-4">
                      No compliance records found. Start by assigning compliance metrics to users.
                    </p>
                    <AssignComplianceMetricDialog onAssignmentCreated={loadComplianceData} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Certification Tracking</h3>
                <CreateComplianceMetricDialog onMetricCreated={loadComplianceData} />
              </div>
              
              <div className="grid gap-4">
                {complianceData.metrics.filter(m => m.category === 'certification').length > 0 ? (
                  complianceData.metrics
                    .filter(m => m.category === 'certification')
                    .map((metric) => {
                      const records = complianceData.allRecords.filter(r => r.metric_id === metric.id);
                      const compliantCount = records.filter(r => r.compliance_status === 'compliant').length;
                      const totalCount = records.length;
                      
                      return (
                        <Card key={metric.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Award className="h-5 w-5 text-blue-600" />
                                  <h4 className="font-medium">{metric.name}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{metric.description}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span>Compliance Rate: {totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0}%</span>
                                  <span>({compliantCount}/{totalCount} providers)</span>
                                </div>
                                <div className="mt-2">
                                  <Progress
                                    value={totalCount > 0 ? (compliantCount / totalCount) * 100 : 0}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Certifications</h3>
                    <p className="text-muted-foreground mb-4">
                      No certification metrics found. Add certification requirements to track compliance.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Compliance Reports</h3>
                <Button onClick={() => {
                  const reportData = {
                    timestamp: new Date().toISOString(),
                    summary: complianceData.summary,
                    metrics: complianceData.metrics.length,
                    records: complianceData.allRecords.length,
                    categories: Object.keys(complianceData.metrics.reduce((acc, m) => ({ ...acc, [m.category]: true }), {}))
                  };
                  console.log('📊 Compliance Report Generated:', reportData);
                  // In a real implementation, this would download a CSV/PDF report
                }}>
                  Generate Report
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Summary Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Metrics:</span>
                        <span>{complianceData.metrics.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Records:</span>
                        <span>{complianceData.allRecords.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compliant Records:</span>
                        <span className="text-green-600">{complianceData.summary?.compliantCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Non-Compliant Records:</span>
                        <span className="text-red-600">{complianceData.summary?.nonCompliantCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Records:</span>
                        <span className="text-yellow-600">{complianceData.summary?.pendingCount || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Compliance by Category</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(
                        complianceData.metrics.reduce((acc, metric) => {
                          if (!acc[metric.category]) acc[metric.category] = 0;
                          acc[metric.category]++;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, count]) => (
                        <div key={category} className="flex justify-between">
                          <span className="capitalize">{category}:</span>
                          <span>{typeof count === 'number' ? count : 0} metrics</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Compliance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {complianceData.allRecords.length > 0 ? (
                    <div className="space-y-2">
                      {complianceData.allRecords.slice(0, 10).map((record) => {
                        const metric = complianceData.metrics.find(m => m.id === record.metric_id);
                        return (
                          <div key={record.id} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <span className="font-medium">{metric?.name || 'Unknown'}</span>
                              <span className="text-sm text-muted-foreground ml-2">({metric?.category})</span>
                            </div>
                            <Badge variant={
                              record.compliance_status === 'compliant' ? 'default' :
                              record.compliance_status === 'pending' ? 'secondary' :
                              'destructive'
                            }>
                              {record.compliance_status}
                            </Badge>
                          </div>
                        );
                      })}
                      {complianceData.allRecords.length > 10 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          Showing 10 of {complianceData.allRecords.length} records
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                      <p className="text-muted-foreground">
                        No compliance records found to generate reports.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
