
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  Calendar,
  User,
  Settings,
  Shield,
  Users,
  Clock
} from 'lucide-react';

export function EnterpriseAuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('7d');

  // Mock audit data
  const auditEvents = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      action: 'team.member.role.updated',
      actor: { name: 'John Doe', role: 'SA' },
      target: { type: 'team_member', name: 'Jane Smith' },
      details: { from: 'MEMBER', to: 'ADMIN', team: 'Alpha Team' },
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      action: 'team.archived',
      actor: { name: 'Admin User', role: 'AD' },
      target: { type: 'team', name: 'Beta Team' },
      details: { reason: 'Project completion' },
      ip: '192.168.1.101',
      status: 'success'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      action: 'workflow.approval.rejected',
      actor: { name: 'Team Lead', role: 'LEAD' },
      target: { type: 'approval_request', name: 'Role Change Request' },
      details: { reason: 'Insufficient justification' },
      ip: '192.168.1.102',
      status: 'completed'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      action: 'team.settings.updated',
      actor: { name: 'Sarah Wilson', role: 'ADMIN' },
      target: { type: 'team', name: 'Gamma Team' },
      details: { changes: ['name', 'description'] },
      ip: '192.168.1.103',
      status: 'success'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      action: 'team.member.added',
      actor: { name: 'Mike Johnson', role: 'LEAD' },
      target: { type: 'team_member', name: 'New Member' },
      details: { role: 'MEMBER', team: 'Delta Team' },
      ip: '192.168.1.104',
      status: 'success'
    }
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('member')) return <Users className="h-4 w-4 text-blue-500" />;
    if (action.includes('workflow') || action.includes('approval')) return <Shield className="h-4 w-4 text-purple-500" />;
    if (action.includes('settings')) return <Settings className="h-4 w-4 text-orange-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('added') || action.includes('approved')) return 'bg-green-100 text-green-800';
    if (action.includes('rejected') || action.includes('removed')) return 'bg-red-100 text-red-800';
    if (action.includes('updated') || action.includes('modified')) return 'bg-blue-100 text-blue-800';
    if (action.includes('archived')) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatActionName = (action: string) => {
    return action
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredEvents = auditEvents.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.actor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.target.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || event.action.includes(actionFilter);
    
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enterprise Audit Trail
          </h3>
          <p className="text-sm text-muted-foreground">
            Complete audit log of all team management actions and changes
          </p>
        </div>
        
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Audit Log
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search actions, users, or targets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="member">Member Actions</SelectItem>
                <SelectItem value="team">Team Actions</SelectItem>
                <SelectItem value="workflow">Workflow Actions</SelectItem>
                <SelectItem value="settings">Settings Changes</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 day</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(event.action)}
                      <div>
                        <div className="font-medium">{formatActionName(event.action)}</div>
                        <Badge variant="outline" className={getActionColor(event.action)}>
                          {event.action}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {event.actor.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{event.actor.role}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">{event.target.name}</div>
                      <div className="text-sm text-muted-foreground">{event.target.type}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {typeof event.details === 'object' ? (
                        <div className="space-y-1">
                          {Object.entries(event.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        event.details
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(event.status)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm">{event.timestamp.toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {event.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {event.ip}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Member Actions</p>
                <p className="text-lg font-semibold">
                  {auditEvents.filter(e => e.action.includes('member')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approval Actions</p>
                <p className="text-lg font-semibold">
                  {auditEvents.filter(e => e.action.includes('approval')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Settings Changes</p>
                <p className="text-lg font-semibold">
                  {auditEvents.filter(e => e.action.includes('settings')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-lg font-semibold">{auditEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
