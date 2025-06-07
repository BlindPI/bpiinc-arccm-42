
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  Calendar, 
  Download, 
  Eye, 
  RotateCcw,
  Filter,
  Clock,
  User,
  Database,
  AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdvancedAuditService } from '@/services/audit/advancedAuditService';
import { toast } from 'sonner';

export function EnterpriseAuditTrail() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7days');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const { data: auditEntries = [], isLoading } = useQuery({
    queryKey: ['audit-trail', dateRange],
    queryFn: async () => {
      // Mock audit trail data
      return [
        {
          id: '1',
          entityType: 'team',
          entityId: 'team-1',
          action: 'update',
          userId: 'user-1',
          userName: 'John Admin',
          timestamp: new Date().toISOString(),
          oldValues: { name: 'Old Team Name', status: 'inactive' },
          newValues: { name: 'New Team Name', status: 'active' },
          changeDescription: 'Updated team name and activated team',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          entityType: 'user',
          entityId: 'user-2',
          action: 'role_change',
          userId: 'user-1',
          userName: 'John Admin',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          oldValues: { role: 'MEMBER' },
          newValues: { role: 'ADMIN' },
          changeDescription: 'Promoted user to admin role',
          ipAddress: '192.168.1.1'
        },
        {
          id: '3',
          entityType: 'team',
          entityId: 'team-2',
          action: 'archive',
          userId: 'user-1',
          userName: 'John Admin',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          oldValues: { status: 'active' },
          newValues: { status: 'archived' },
          changeDescription: 'Archived team due to inactivity',
          ipAddress: '192.168.1.2'
        }
      ];
    }
  });

  const rollbackMutation = useMutation({
    mutationFn: (auditEntryId: string) =>
      AdvancedAuditService.rollbackChanges(auditEntryId, 'current-user-id'),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Changes rolled back successfully');
      } else {
        toast.error(`Rollback failed: ${result.errorMessage}`);
      }
      queryClient.invalidateQueries({ queryKey: ['audit-trail'] });
    },
    onError: (error) => {
      toast.error(`Rollback failed: ${error.message}`);
    }
  });

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = entry.changeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || entry.entityType === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'archive': return 'bg-yellow-100 text-yellow-800';
      case 'role_change': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Database className="h-4 w-4" />;
      case 'update': return <FileText className="h-4 w-4" />;
      case 'delete': return <AlertTriangle className="h-4 w-4" />;
      case 'archive': return <Clock className="h-4 w-4" />;
      case 'role_change': return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audit Trail Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Enterprise Audit Trail</h2>
          <p className="text-muted-foreground">Complete system activity monitoring and change tracking</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Audit Log
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Audit Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Audit Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="archive">Archive</SelectItem>
                <SelectItem value="role_change">Role Change</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="team">Teams</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="provider">Providers</SelectItem>
                <SelectItem value="location">Locations</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries ({filteredEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getActionIcon(entry.action)}
                      <Badge className={getActionColor(entry.action)}>
                        {entry.action.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {entry.entityType}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{entry.changeDescription}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">User:</span>
                        <div className="font-medium">{entry.userName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">IP Address:</span>
                        <div className="font-medium">{entry.ipAddress || 'Unknown'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Entity ID:</span>
                        <div className="font-medium font-mono text-xs">{entry.entityId}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Entry Details</DialogTitle>
                        </DialogHeader>
                        {selectedEntry && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Action</label>
                                <div className="mt-1">{selectedEntry.action}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Entity Type</label>
                                <div className="mt-1">{selectedEntry.entityType}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">User</label>
                                <div className="mt-1">{selectedEntry.userName}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Timestamp</label>
                                <div className="mt-1">{new Date(selectedEntry.timestamp).toLocaleString()}</div>
                              </div>
                            </div>
                            
                            {selectedEntry.oldValues && (
                              <div>
                                <label className="text-sm font-medium">Old Values</label>
                                <pre className="mt-1 p-3 bg-gray-100 rounded text-xs">
                                  {JSON.stringify(selectedEntry.oldValues, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {selectedEntry.newValues && (
                              <div>
                                <label className="text-sm font-medium">New Values</label>
                                <pre className="mt-1 p-3 bg-gray-100 rounded text-xs">
                                  {JSON.stringify(selectedEntry.newValues, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    {entry.oldValues && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rollbackMutation.mutate(entry.id)}
                        disabled={rollbackMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
