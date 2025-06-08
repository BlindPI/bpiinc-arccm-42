
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Eye, Download, Calendar, User, FileText } from 'lucide-react';
import { AuditComplianceService } from '@/services/governance/auditComplianceService';

export function AuditTrailViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: auditEntries = [], isLoading } = useQuery({
    queryKey: ['audit-trail', entityTypeFilter, riskLevelFilter],
    queryFn: () => AuditComplianceService.getAuditTrail(
      entityTypeFilter || undefined,
      undefined,
      undefined,
      undefined,
      undefined
    )
  });

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.action_performed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.change_summary?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = !riskLevelFilter || entry.risk_level === riskLevelFilter;
    
    return matchesSearch && matchesRisk;
  });

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const viewEntryDetails = (entry: any) => {
    setSelectedEntry(entry);
    setShowDetailsDialog(true);
  };

  const exportAuditTrail = () => {
    // Implementation would generate CSV/PDF export
    console.log('Exporting audit trail...');
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">
            Comprehensive audit log of all system activities
          </p>
        </div>
        <Button onClick={exportAuditTrail} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search audit entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Entity Types</SelectItem>
                <SelectItem value="teams">Teams</SelectItem>
                <SelectItem value="profiles">Users</SelectItem>
                <SelectItem value="certificates">Certificates</SelectItem>
                <SelectItem value="team_members">Team Members</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Risk Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Entries ({filteredEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.slice(0, 50).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {entry.action_performed}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{entry.entity_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.entity_id.slice(0, 8)}...
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {entry.user_id ? entry.user_id.slice(0, 8) + '...' : 'System'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={getRiskBadgeVariant(entry.risk_level)}
                      className={getRiskColor(entry.risk_level)}
                    >
                      {entry.risk_level}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <p className="text-sm truncate max-w-48">
                      {entry.change_summary || 'No summary available'}
                    </p>
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewEntryDetails(entry)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No audit entries found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Audit Entry Details</DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Event Type:</strong> {selectedEntry.event_type}</div>
                    <div><strong>Action:</strong> {selectedEntry.action_performed}</div>
                    <div><strong>Entity:</strong> {selectedEntry.entity_type}</div>
                    <div><strong>Entity ID:</strong> {selectedEntry.entity_id}</div>
                    <div><strong>Risk Level:</strong> 
                      <Badge variant={getRiskBadgeVariant(selectedEntry.risk_level)} className="ml-2">
                        {selectedEntry.risk_level}
                      </Badge>
                    </div>
                    <div><strong>Timestamp:</strong> {new Date(selectedEntry.created_at).toLocaleString()}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Session Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>User ID:</strong> {selectedEntry.user_id || 'System'}</div>
                    <div><strong>Session ID:</strong> {selectedEntry.session_id || 'N/A'}</div>
                    <div><strong>IP Address:</strong> {selectedEntry.ip_address || 'N/A'}</div>
                    <div><strong>User Agent:</strong> 
                      <span className="text-xs break-all">{selectedEntry.user_agent || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedEntry.change_summary && (
                <div>
                  <h4 className="font-semibold mb-2">Change Summary</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedEntry.change_summary}</p>
                </div>
              )}
              
              {selectedEntry.compliance_flags && selectedEntry.compliance_flags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Compliance Flags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.compliance_flags.map((flag: string, index: number) => (
                      <Badge key={index} variant="secondary">{flag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedEntry.before_state && (
                  <div>
                    <h4 className="font-semibold mb-2">Before State</h4>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(selectedEntry.before_state, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedEntry.after_state && (
                  <div>
                    <h4 className="font-semibold mb-2">After State</h4>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(selectedEntry.after_state, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
