
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  FileText,
  Target,
  Activity
} from 'lucide-react';
import { AuditComplianceService } from '@/services/governance/auditComplianceService';
import { toast } from 'sonner';

export function ComplianceDashboard() {
  const queryClient = useQueryClient();
  const [selectedViolation, setSelectedViolation] = useState<any>(null);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: complianceMetrics } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: () => AuditComplianceService.getComplianceMetrics(),
    refetchInterval: 30000
  });

  const { data: violations = [] } = useQuery({
    queryKey: ['compliance-violations'],
    queryFn: () => AuditComplianceService.getComplianceViolations()
  });

  const { data: riskAssessments = [] } = useQuery({
    queryKey: ['risk-assessments'],
    queryFn: () => AuditComplianceService.getRiskAssessments()
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['compliance-frameworks'],
    queryFn: () => AuditComplianceService.getComplianceFrameworks()
  });

  const { data: regulatoryReports = [] } = useQuery({
    queryKey: ['regulatory-reports'],
    queryFn: () => AuditComplianceService.getRegulatoryReports()
  });

  const resolveViolationMutation = useMutation({
    mutationFn: ({ violationId, notes }: { violationId: string; notes: string }) =>
      AuditComplianceService.resolveComplianceViolation(violationId, notes, 'current-user-id'),
    onSuccess: () => {
      toast.success('Violation resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-violations'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-metrics'] });
      setShowResolutionDialog(false);
      setResolutionNotes('');
    },
    onError: () => {
      toast.error('Failed to resolve violation');
    }
  });

  const openViolations = violations.filter(v => v.status === 'open');
  const criticalViolations = openViolations.filter(v => v.severity === 'critical');
  const highRisks = riskAssessments.filter(r => r.risk_level === 'critical' || r.risk_level === 'high');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'investigating': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'false_positive': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleResolveViolation = (violation: any) => {
    setSelectedViolation(violation);
    setShowResolutionDialog(true);
  };

  const submitResolution = () => {
    if (!selectedViolation || !resolutionNotes.trim()) return;
    
    resolveViolationMutation.mutate({
      violationId: selectedViolation.id,
      notes: resolutionNotes.trim()
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor compliance status, violations, and risk assessments
        </p>
      </div>

      {/* Metrics Overview */}
      {complianceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Rate</p>
                  <p className="text-2xl font-bold">{complianceMetrics.complianceRate}%</p>
                </div>
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <Progress value={complianceMetrics.complianceRate} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Violations</p>
                  <p className="text-2xl font-bold">{complianceMetrics.openViolations}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Risks</p>
                  <p className="text-2xl font-bold">{complianceMetrics.criticalRisks}</p>
                </div>
                <Target className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reports</p>
                  <p className="text-2xl font-bold">{complianceMetrics.pendingReports}</p>
                </div>
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Violations ({openViolations.length})
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Risk Assessments ({highRisks.length})
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Frameworks ({frameworks.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Regulatory Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          {/* Critical Violations Alert */}
          {criticalViolations.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">
                    {criticalViolations.length} Critical Violation{criticalViolations.length !== 1 ? 's' : ''} Requiring Immediate Attention
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {openViolations.map((violation) => (
              <Card key={violation.id} className={violation.severity === 'critical' ? 'border-red-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(violation.status)}
                        <h3 className="font-semibold">{violation.violation_type}</h3>
                        <Badge className={getSeverityColor(violation.severity)}>
                          {violation.severity}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {violation.violation_description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Entity:</span>
                          <p>{violation.entity_type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Detected:</span>
                          <p>{new Date(violation.detected_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleResolveViolation(violation)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {openViolations.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className="text-muted-foreground">No open violations</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="space-y-4">
            {highRisks.map((risk) => (
              <Card key={risk.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{risk.risk_name}</h3>
                        <Badge className={getSeverityColor(risk.risk_level)}>
                          {risk.risk_level} ({risk.risk_score})
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {risk.risk_description}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <p>{risk.risk_category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className="capitalize">{risk.status}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Review Date:</span>
                          <p>{risk.review_date ? new Date(risk.review_date).toLocaleDateString() : 'Not set'}</p>
                        </div>
                      </div>
                      
                      {risk.mitigation_plan && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <strong>Mitigation Plan:</strong> {risk.mitigation_plan}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {highRisks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className="text-muted-foreground">No high-risk assessments</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{framework.framework_name}</CardTitle>
                  {framework.framework_version && (
                    <Badge variant="outline">v{framework.framework_version}</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {framework.framework_description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Requirements:</span>
                      <span>{Object.keys(framework.requirements).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Assessment Criteria:</span>
                      <span>{Object.keys(framework.assessment_criteria).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="space-y-4">
            {regulatoryReports.slice(0, 10).map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{report.report_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {report.regulatory_body} • {report.report_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Period: {new Date(report.reporting_period_start).toLocaleDateString()} - {new Date(report.reporting_period_end).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={
                        report.report_status === 'submitted' ? 'bg-green-100 text-green-800' :
                        report.report_status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {report.report_status}
                      </Badge>
                      {report.submission_deadline && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(report.submission_deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Resolution Dialog */}
      <Dialog open={showResolutionDialog} onOpenChange={setShowResolutionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Compliance Violation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedViolation && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Violation:</strong> {selectedViolation.violation_type}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedViolation.violation_description}
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="resolution-notes">Resolution Notes (Required)</Label>
              <Textarea
                id="resolution-notes"
                placeholder="Describe how this violation was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResolutionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitResolution}
                disabled={resolveViolationMutation.isPending || !resolutionNotes.trim()}
              >
                {resolveViolationMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
