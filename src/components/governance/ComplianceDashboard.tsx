
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, FileText, Users } from 'lucide-react';
import { AuditComplianceService } from '@/services/governance/auditComplianceService';
import { toast } from 'sonner';

export function ComplianceDashboard() {
  const queryClient = useQueryClient();
  const [selectedViolation, setSelectedViolation] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Fetch compliance overview metrics
  const { data: complianceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: () => AuditComplianceService.getComplianceMetrics()
  });

  // Fetch compliance violations
  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: ['compliance-violations'],
    queryFn: () => AuditComplianceService.getComplianceViolations()
  });

  // Fetch compliance frameworks
  const { data: frameworks = [], isLoading: frameworksLoading } = useQuery({
    queryKey: ['compliance-frameworks'],
    queryFn: () => AuditComplianceService.getComplianceFrameworks()
  });

  // Resolve violation mutation
  const resolveViolationMutation = useMutation({
    mutationFn: ({ violationId, notes }: { violationId: string; notes: string }) =>
      AuditComplianceService.resolveComplianceViolation(violationId, 'current-user-id', notes),
    onSuccess: () => {
      toast.success('Violation resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-violations'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-metrics'] });
      setShowResolveModal(false);
      setResolutionNotes('');
      setSelectedViolation(null);
    },
    onError: (error) => {
      toast.error(`Failed to resolve violation: ${error.message}`);
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const handleResolveViolation = (violation: any) => {
    setSelectedViolation(violation);
    setShowResolveModal(true);
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor compliance status, violations, and risk assessments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance Rate: {complianceMetrics?.complianceRate?.toFixed(1) || 0}%
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics?.totalViolations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {complianceMetrics?.openViolations || 0} open, {complianceMetrics?.resolvedViolations || 0} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics?.complianceRate?.toFixed(1) || 0}%</div>
            <Progress value={complianceMetrics?.complianceRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Frameworks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics?.activeFrameworks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Regulatory frameworks monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Low</div>
            <p className="text-xs text-muted-foreground">
              Overall risk assessment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="violations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="assessments">Risk Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Compliance Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {violationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detected</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.slice(0, 20).map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell className="font-medium">
                          {violation.violation_type}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{violation.entity_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {violation.entity_id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(violation.severity)}>
                            {violation.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={violation.status === 'resolved' ? 'default' : 'secondary'}>
                            {violation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(violation.detected_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {violation.status === 'open' && (
                            <Button
                              size="sm"
                              onClick={() => handleResolveViolation(violation)}
                            >
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {violations.length === 0 && !violationsLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No compliance violations found</p>
                  <p className="text-sm">Your organization is fully compliant</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Compliance Frameworks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {frameworksLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {frameworks.map((framework) => (
                    <Card key={framework.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{framework.framework_name}</h3>
                          {framework.framework_version && (
                            <p className="text-sm text-muted-foreground">
                              Version: {framework.framework_version}
                            </p>
                          )}
                          {framework.framework_description && (
                            <p className="text-sm mt-2">{framework.framework_description}</p>
                          )}
                        </div>
                        <Badge variant={framework.is_active ? 'default' : 'secondary'}>
                          {framework.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {frameworks.length === 0 && !frameworksLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No compliance frameworks configured</p>
                  <p className="text-sm">Contact your administrator to set up frameworks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Risk assessment module</p>
                <p className="text-sm">Coming soon - Advanced risk analysis and reporting</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Violation Modal */}
      <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Compliance Violation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedViolation && (
              <div className="space-y-2">
                <div><strong>Type:</strong> {selectedViolation.violation_type}</div>
                <div><strong>Severity:</strong> 
                  <Badge variant={getSeverityBadgeVariant(selectedViolation.severity)} className="ml-2">
                    {selectedViolation.severity}
                  </Badge>
                </div>
                <div><strong>Description:</strong> {selectedViolation.violation_description || 'No description provided'}</div>
              </div>
            )}
            
            <div>
              <Label htmlFor="resolution-notes">Resolution Notes</Label>
              <Textarea
                id="resolution-notes"
                placeholder="Describe how this violation was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResolveModal(false);
                  setResolutionNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => resolveViolationMutation.mutate({
                  violationId: selectedViolation?.id,
                  notes: resolutionNotes
                })}
                disabled={!resolutionNotes.trim() || resolveViolationMutation.isPending}
              >
                {resolveViolationMutation.isPending ? 'Resolving...' : 'Resolve Violation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
