
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Shield,
  User,
  Database,
  Settings,
  Calendar
} from 'lucide-react';
import { useAuditTrail } from '@/hooks/useAuditTrail';
import { PageHeader } from '@/components/ui/PageHeader';
import { TableSkeleton } from '@/components/ui/skeleton-variants';

export const AuditTrailDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const {
    auditLogs,
    filteredLogs,
    searchLogs,
    exportLogs,
    isLoading
  } = useAuditTrail({ searchTerm, action: selectedAction, dateRange });

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'create':
      case 'update':
      case 'delete':
        return <Database className="h-4 w-4 text-green-600" />;
      case 'configuration':
        return <Settings className="h-4 w-4 text-purple-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return 'bg-blue-100 text-blue-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'configuration': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Shield className="h-7 w-7 text-primary" />}
          title="Audit Trail"
          subtitle="System activity logs and security auditing"
        />
        <TableSkeleton rows={10} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Shield className="h-7 w-7 text-primary" />}
        title="Audit Trail"
        subtitle="System activity logs and security auditing"
        actions={
          <Button onClick={exportLogs} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <select
                id="action"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="configuration">Configuration</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Total Events</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {filteredLogs?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Last 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              <span className="font-medium">Unique Users</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {new Set(filteredLogs?.map(log => log.userId) || []).size}
            </div>
            <div className="text-sm text-muted-foreground">
              Active users
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Data Changes</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {filteredLogs?.filter(log => ['create', 'update', 'delete'].includes(log.action.toLowerCase())).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              CRUD operations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Config Changes</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {filteredLogs?.filter(log => log.action.toLowerCase().includes('configuration')).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              System modifications
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs && filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {getActionIcon(log.action)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.action}</span>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        User: {log.userName || 'System'} • IP: {log.ipAddress || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.resource}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
                <p>No logs match your current filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
