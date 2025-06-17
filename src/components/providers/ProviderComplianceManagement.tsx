import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ComplianceService } from '@/services/compliance/complianceService';
import type { ComplianceMetric, UserComplianceRecord, ComplianceAction } from '@/services/compliance/complianceService';
import { CheckCircle, XCircle, AlertTriangle, Award, Calendar, Plus, Edit, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface ProviderComplianceManagementProps {
  providerId: string;
}

export function ProviderComplianceManagement({ providerId }: ProviderComplianceManagementProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [showMetricDialog, setShowMetricDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UserComplianceRecord | null>(null);

  // Fetch compliance data
  const { data: complianceSummary } = useQuery({
    queryKey: ['compliance-summary', providerId],
    queryFn: () => ComplianceService.getUserComplianceSummary(providerId)
  });

  const { data: complianceRecords = [] } = useQuery({
    queryKey: ['compliance-records', providerId],
    queryFn: () => ComplianceService.getUserComplianceRecords(providerId)
  });

  const { data: complianceActions = [] } = useQuery({
    queryKey: ['compliance-actions', providerId],
    queryFn: () => ComplianceService.getUserComplianceActions(providerId)
  });

  const { data: complianceMetrics = [] } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: () => ComplianceService.getComplianceMetrics(),
    enabled: ['SA', 'AD'].includes(profile?.role || '')
  });

  const { data: auditLog = [] } = useQuery({
    queryKey: ['compliance-audit-log', providerId],
    queryFn: () => ComplianceService.getComplianceAuditLog(providerId)
  });

  // Mutations
  const updateRecordMutation = useMutation({
    mutationFn: ({ metricId, value, status, notes }: {
      metricId: string;
      value: any;
      status: 'compliant' | 'non_compliant' | 'warning' | 'pending';
      notes?: string;
    }) => ComplianceService.updateComplianceRecord(providerId, metricId, value, status, notes),
    onSuccess: () => {
      toast.success('Compliance record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-summary', providerId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-records', providerId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-audit-log', providerId] });
    },
    onError: (error) => {
      toast.error(`Failed to update compliance record: ${error.message}`);
    }
  });

  const createActionMutation = useMutation({
    mutationFn: (action: Partial<ComplianceAction>) => ComplianceService.createComplianceAction(action),
    onSuccess: () => {
      toast.success('Compliance action created successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-actions', providerId] });
      setShowActionDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to create compliance action: ${error.message}`);
    }
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ actionId, status }: { actionId: string; status: string }) =>
      ComplianceService.updateComplianceActionStatus(actionId, status as any),
    onSuccess: () => {
      toast.success('Action status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-actions', providerId] });
    },
    onError: (error) => {
      toast.error(`Failed to update action: ${error.message}`);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'warning': return 'secondary';
      case 'non_compliant': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const isAdmin = ['SA', 'AD'].includes(profile?.role || '');

  return (
    <div className="space-y-6">
      {/* Compliance Score Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Compliance</p>
                <p className="text-2xl font-bold text-green-600">
                  {complianceSummary?.overall_score?.toFixed(1) || '0.0'}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${complianceSummary?.overall_score || 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliant Metrics</p>
                <p className="text-2xl font-bold text-blue-600">
                  {complianceSummary?.compliant_count || 0}/{complianceSummary?.total_metrics || 0}
                </p>
              </div>
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {complianceSummary?.warning_count || 0} warnings, {complianceSummary?.non_compliant_count || 0} non-compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Actions</p>
                <p className="text-2xl font-bold text-red-600">
                  {complianceSummary?.overdue_actions || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {complianceActions.filter(a => a.status === 'open').length} total open actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Compliance Requirements
            </CardTitle>
            {isAdmin && (
              <Button onClick={() => setShowMetricDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    record.compliance_status === 'compliant' ? 'bg-green-500' :
                    record.compliance_status === 'warning' ? 'bg-yellow-500' : 
                    record.compliance_status === 'non_compliant' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <div>
                    <h4 className="font-medium">{record.compliance_metrics?.name || 'Unknown Metric'}</h4>
                    <p className="text-sm text-muted-foreground">
                      Category: {record.compliance_metrics?.category || 'general'}
                      {record.last_checked_at && (
                        <span> • Last checked: {new Date(record.last_checked_at).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(record.compliance_status)}>
                    {record.compliance_status.replace('_', ' ')}
                  </Badge>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Update
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {complianceRecords.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No compliance records found</p>
                <p className="text-sm">Compliance metrics will appear here once configured</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Required Actions</CardTitle>
            {isAdmin && (
              <Button onClick={() => setShowActionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Action
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceActions.map((action) => (
              <div key={action.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                action.priority === 'critical' ? 'border-red-200 bg-red-50' :
                action.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                action.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' : ''
              }`}>
                <div>
                  <h4 className="font-medium">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  {action.due_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(action.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(action.priority)}>
                    {action.priority}
                  </Badge>
                  <Badge variant={action.status === 'completed' ? 'default' : 'outline'}>
                    {action.status.replace('_', ' ')}
                  </Badge>
                  {isAdmin && action.status !== 'completed' && (
                    <Button 
                      size="sm" 
                      onClick={() => updateActionMutation.mutate({ 
                        actionId: action.id, 
                        status: 'completed' 
                      })}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {complianceActions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No compliance actions found</p>
                <p className="text-sm">Action items will appear here when compliance issues are identified</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance History */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLog.slice(0, 10).map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{entry.audit_type.replace('_', ' ')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {entry.compliance_metrics?.name || 'System'} • {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">
                  {entry.compliance_metrics?.category || 'system'}
                </Badge>
              </div>
            ))}

            {auditLog.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit history found</p>
                <p className="text-sm">Compliance changes and updates will be logged here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Record Dialog */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Compliance Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Metric</label>
                <p className="text-sm text-muted-foreground">{selectedRecord.compliance_metrics?.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Compliance Status</label>
                <Select 
                  defaultValue={selectedRecord.compliance_status}
                  onValueChange={(value) => {
                    updateRecordMutation.mutate({
                      metricId: selectedRecord.metric_id,
                      value: { status: value },
                      status: value as any,
                      notes: `Status updated to ${value} by ${profile?.display_name || 'admin'}`
                    });
                    setSelectedRecord(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}