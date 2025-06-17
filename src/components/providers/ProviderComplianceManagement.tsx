import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ComplianceService } from '@/services/compliance/complianceService';
import type { ComplianceMetric, UserComplianceRecord, ComplianceAction, ComplianceDocument, DocumentRequirement } from '@/services/compliance/complianceService';
import { CheckCircle, XCircle, AlertTriangle, Award, Calendar, Plus, Edit, Settings, Save, X, Upload, Download, FileText, Eye } from 'lucide-react';
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
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UserComplianceRecord | null>(null);
  const [selectedMetricForUpload, setSelectedMetricForUpload] = useState<string>('');
  
  // Form states for dialogs
  const [newMetric, setNewMetric] = useState({
    name: '',
    description: '',
    category: 'certification',
    required_for_roles: [] as string[],
    measurement_type: 'boolean' as const,
    weight: 1
  });
  
  const [newAction, setNewAction] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    due_date: '',
    metric_id: ''
  });
  
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  
  // Document upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');

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

  const { data: complianceDocuments = [] } = useQuery({
    queryKey: ['compliance-documents', providerId],
    queryFn: () => ComplianceService.getUserComplianceDocuments(providerId)
  });

  const { data: documentsForVerification = [] } = useQuery({
    queryKey: ['documents-for-verification'],
    queryFn: () => ComplianceService.getDocumentsForVerification(),
    enabled: isAdmin
  });

  // Mutations
  const createMetricMutation = useMutation({
    mutationFn: (metric: Partial<ComplianceMetric>) => {
      console.log('🔥 Creating compliance metric:', metric);
      return ComplianceService.upsertComplianceMetric(metric);
    },
    onSuccess: () => {
      console.log('✅ Compliance metric created successfully');
      toast.success('Compliance metric created successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-metrics'] });
      setShowMetricDialog(false);
      setNewMetric({
        name: '',
        description: '',
        category: 'certification',
        required_for_roles: [],
        measurement_type: 'boolean',
        weight: 1
      });
    },
    onError: (error) => {
      console.error('❌ Failed to create compliance metric:', error);
      toast.error(`Failed to create compliance metric: ${error.message}`);
    }
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ metricId, value, status, notes }: {
      metricId: string;
      value: any;
      status: 'compliant' | 'non_compliant' | 'warning' | 'pending';
      notes?: string;
    }) => {
      console.log('🔥 Updating compliance record:', { metricId, value, status, notes });
      return ComplianceService.updateComplianceRecord(providerId, metricId, value, status, notes);
    },
    onSuccess: () => {
      console.log('✅ Compliance record updated successfully');
      toast.success('Compliance record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-summary', providerId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-records', providerId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-audit-log', providerId] });
      setSelectedRecord(null);
    },
    onError: (error) => {
      console.error('❌ Failed to update compliance record:', error);
      toast.error(`Failed to update compliance record: ${error.message}`);
    }
  });

  const createActionMutation = useMutation({
    mutationFn: (action: Partial<ComplianceAction>) => {
      console.log('🔥 Creating compliance action:', action);
      return ComplianceService.createComplianceAction({
        ...action,
        user_id: providerId
      });
    },
    onSuccess: () => {
      console.log('✅ Compliance action created successfully');
      toast.success('Compliance action created successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-actions', providerId] });
      setShowActionDialog(false);
      setNewAction({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        metric_id: ''
      });
    },
    onError: (error) => {
      console.error('❌ Failed to create compliance action:', error);
      toast.error(`Failed to create compliance action: ${error.message}`);
    }
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ actionId, status }: { actionId: string; status: string }) => {
      console.log('🔥 Updating action status:', { actionId, status });
      return ComplianceService.updateComplianceActionStatus(actionId, status as any);
    },
    onSuccess: () => {
      console.log('✅ Action status updated successfully');
      toast.success('Action status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-actions', providerId] });
    },
    onError: (error) => {
      console.error('❌ Failed to update action:', error);
      toast.error(`Failed to update action: ${error.message}`);
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: ({ file, metricId, expiryDate }: { file: File; metricId: string; expiryDate?: string }) => {
      console.log('🔥 Uploading compliance document:', { fileName: file.name, metricId, expiryDate });
      return ComplianceService.uploadComplianceDocument(providerId, metricId, file, expiryDate);
    },
    onSuccess: () => {
      console.log('✅ Document uploaded successfully');
      toast.success('Document uploaded successfully and is pending verification');
      queryClient.invalidateQueries({ queryKey: ['compliance-documents', providerId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-records', providerId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-summary', providerId] });
      queryClient.invalidateQueries({ queryKey: ['documents-for-verification'] });
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadExpiryDate('');
      setUploadNotes('');
      setSelectedMetricForUpload('');
    },
    onError: (error) => {
      console.error('❌ Failed to upload document:', error);
      toast.error(`Failed to upload document: ${error.message}`);
    }
  });

  const verifyDocumentMutation = useMutation({
    mutationFn: ({ documentId, status, notes, rejectionReason }: {
      documentId: string;
      status: 'approved' | 'rejected';
      notes?: string;
      rejectionReason?: string;
    }) => {
      console.log('🔥 Verifying document:', { documentId, status, notes });
      return ComplianceService.verifyComplianceDocument(documentId, status, notes, rejectionReason);
    },
    onSuccess: () => {
      console.log('✅ Document verified successfully');
      toast.success('Document verification completed');
      queryClient.invalidateQueries({ queryKey: ['compliance-documents', providerId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-records', providerId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-summary', providerId] });
      queryClient.invalidateQueries({ queryKey: ['documents-for-verification'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-audit-log', providerId] });
    },
    onError: (error) => {
      console.error('❌ Failed to verify document:', error);
      toast.error(`Failed to verify document: ${error.message}`);
    }
  });

  // Form handlers
  const handleCreateMetric = () => {
    if (!newMetric.name.trim()) {
      toast.error('Metric name is required');
      return;
    }
    createMetricMutation.mutate(newMetric);
  };

  const handleCreateAction = () => {
    if (!newAction.title.trim()) {
      toast.error('Action title is required');
      return;
    }
    createActionMutation.mutate(newAction);
  };

  const handleUpdateRecord = () => {
    if (!selectedRecord || !updateStatus) {
      toast.error('Please select a status');
      return;
    }
    updateRecordMutation.mutate({
      metricId: selectedRecord.metric_id,
      value: { status: updateStatus, updated_by: profile?.display_name },
      status: updateStatus as any,
      notes: updateNotes || `Status updated to ${updateStatus} by ${profile?.display_name || 'admin'}`
    });
  };

  const handleUploadDocument = () => {
    if (!uploadFile || !selectedMetricForUpload) {
      toast.error('Please select a file and metric');
      return;
    }
    uploadDocumentMutation.mutate({
      file: uploadFile,
      metricId: selectedMetricForUpload,
      expiryDate: uploadExpiryDate || undefined
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        toast.error('File type not allowed. Please upload PDF, JPG, PNG, DOC, or DOCX files.');
        return;
      }
      
      setUploadFile(file);
    }
  };

  const handleDownloadDocument = async (document: ComplianceDocument) => {
    try {
      const url = await ComplianceService.getDocumentDownloadUrl(document.file_path);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

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

      {/* Add Metric Dialog */}
      <Dialog open={showMetricDialog} onOpenChange={setShowMetricDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Compliance Metric</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Metric Name</label>
              <Input
                value={newMetric.name}
                onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                placeholder="e.g., CPR Certification"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={newMetric.description}
                onChange={(e) => setNewMetric({ ...newMetric, description: e.target.value })}
                placeholder="Describe the compliance requirement..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={newMetric.category}
                onValueChange={(value) => setNewMetric({ ...newMetric, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Required for Roles</label>
              <div className="grid grid-cols-2 gap-2">
                {['AP', 'IN', 'TM', 'ST'].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={role}
                      checked={newMetric.required_for_roles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewMetric({
                            ...newMetric,
                            required_for_roles: [...newMetric.required_for_roles, role]
                          });
                        } else {
                          setNewMetric({
                            ...newMetric,
                            required_for_roles: newMetric.required_for_roles.filter(r => r !== role)
                          });
                        }
                      }}
                    />
                    <label htmlFor={role} className="text-sm">{role}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Weight (1-5)</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={newMetric.weight}
                onChange={(e) => setNewMetric({ ...newMetric, weight: parseInt(e.target.value) || 1 })}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowMetricDialog(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreateMetric}
                disabled={createMetricMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {createMetricMutation.isPending ? 'Creating...' : 'Create Metric'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Compliance Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Action Title</label>
              <Input
                value={newAction.title}
                onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                placeholder="e.g., Update Training Records"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={newAction.description}
                onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                placeholder="Describe what needs to be done..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select
                value={newAction.priority}
                onValueChange={(value) => setNewAction({ ...newAction, priority: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Due Date</label>
              <Input
                type="date"
                value={newAction.due_date}
                onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Related Metric</label>
              <Select
                value={newAction.metric_id}
                onValueChange={(value) => setNewAction({ ...newAction, metric_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a metric (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {complianceMetrics.map((metric) => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowActionDialog(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreateAction}
                disabled={createActionMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {createActionMutation.isPending ? 'Creating...' : 'Create Action'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Record Dialog */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Compliance Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Metric</label>
                <p className="text-sm text-muted-foreground">{selectedRecord.compliance_metrics?.name}</p>
                <p className="text-xs text-muted-foreground">Category: {selectedRecord.compliance_metrics?.category}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Current Status</label>
                <Badge variant={getStatusColor(selectedRecord.compliance_status)}>
                  {selectedRecord.compliance_status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">New Status</label>
                <Select
                  value={updateStatus}
                  onValueChange={setUpdateStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Textarea
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Add notes about this update..."
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRecord(null);
                    setUpdateStatus('');
                    setUpdateNotes('');
                  }}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateRecord}
                  disabled={updateRecordMutation.isPending || !updateStatus}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateRecordMutation.isPending ? 'Updating...' : 'Update Record'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}