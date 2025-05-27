
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, History, RotateCcw, Search, Filter, 
  Download, AlertTriangle, CheckCircle, User, 
  Clock, Database, Settings, Eye, ChevronRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdvancedAuditService } from '@/services/audit/advancedAuditService';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export const AdvancedAuditDashboard: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; id: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const queryClient = useQueryClient();

  const { data: auditTrail, isLoading } = useQuery({
    queryKey: ['audit-trail', selectedEntity?.type, selectedEntity?.id],
    queryFn: () => selectedEntity 
      ? AdvancedAuditService.getEntityAuditTrail(selectedEntity.type, selectedEntity.id)
      : null,
    enabled: !!selectedEntity
  });

  const { data: complianceReport } = useQuery({
    queryKey: ['compliance-report', dateRange.start, dateRange.end],
    queryFn: () => dateRange.start && dateRange.end
      ? AdvancedAuditService.getComplianceReport(dateRange.start, dateRange.end)
      : null,
    enabled: !!(dateRange.start && dateRange.end)
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ auditEntryId, performedBy }: { auditEntryId: string; performedBy: string }) =>
      AdvancedAuditService.rollbackChanges(auditEntryId, performedBy),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Changes rolled back successfully');
        queryClient.invalidateQueries(['audit-trail']);
      } else {
        toast.error(`Rollback failed: ${result.errorMessage}`);
      }
    }
  });

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return <Database className="h-4 w-4 text-green-600" />;
      case 'update': return <Settings className="h-4 w-4 text-blue-600" />;
      case 'delete': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'rollback': return <RotateCcw className="h-4 w-4 text-purple-600" />;
      default: return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'rollback': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRollback = (auditEntryId: string) => {
    if (confirm('Are you sure you want to rollback these changes? This action cannot be undone.')) {
      rollbackMutation.mutate({ 
        auditEntryId, 
        performedBy: 'current-user' // In real implementation, get from auth context
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Shield className="h-7 w-7 text-primary" />}
        title="Advanced Audit Trail"
        subtitle="Comprehensive change history with rollback capabilities"
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Audit Log
          </Button>
        }
      />

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Entity Search</TabsTrigger>
          <TabsTrigger value="trail">Audit Trail</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Report</TabsTrigger>
          <TabsTrigger value="rollback">Rollback History</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Entity History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const [type, id] = e.target.value.split(':');
                      setSelectedEntity(type && id ? { type, id } : null);
                    }}
                  >
                    <option value="">Select entity type</option>
                    <option value="team:sample-team-id">Team</option>
                    <option value="provider:sample-provider-id">Provider</option>
                    <option value="user:sample-user-id">User</option>
                    <option value="certificate:sample-cert-id">Certificate</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Search Term</Label>
                  <Input 
                    placeholder="Search by entity ID or name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quick Filters</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Recent</Button>
                    <Button variant="outline" size="sm">High Risk</Button>
                  </div>
                </div>
              </div>

              {selectedEntity && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Viewing audit trail for {selectedEntity.type}: {selectedEntity.id}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trail" className="space-y-6">
          {auditTrail && auditTrail.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Change History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditTrail.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getActionIcon(entry.action)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getActionColor(entry.action)}>
                                {entry.action}
                              </Badge>
                              <span className="font-medium">{entry.changeDescription}</span>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {entry.userName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(entry.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {entry.ipAddress && (
                                <div>IP: {entry.ipAddress}</div>
                              )}
                            </div>

                            {entry.oldValues && entry.newValues && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <div className="font-medium text-red-600 mb-1">Before:</div>
                                  <pre className="bg-red-50 p-2 rounded text-red-800 overflow-auto">
                                    {JSON.stringify(entry.oldValues, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <div className="font-medium text-green-600 mb-1">After:</div>
                                  <pre className="bg-green-50 p-2 rounded text-green-800 overflow-auto">
                                    {JSON.stringify(entry.newValues, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {entry.oldValues && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRollback(entry.id)}
                              disabled={rollbackMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Rollback
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Audit Trail</h3>
                <p className="text-muted-foreground">
                  Select an entity to view its change history
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Compliance Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {complianceReport && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {complianceReport.summary.totalActions}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Actions</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {complianceReport.summary.userActions}
                    </div>
                    <div className="text-sm text-muted-foreground">User Actions</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {complianceReport.summary.complianceScore.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Compliance Score</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rollback">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Rollback Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <RotateCcw className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Rollback History</h3>
                <p>Previous rollback operations would be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAuditDashboard;
