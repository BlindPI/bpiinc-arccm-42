
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Search, Filter, User, FileText, Settings, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AuditEvent {
  id: string;
  event_type: string;
  user_id: string;
  user_name: string;
  target_user_id?: string;
  target_user_name?: string;
  description: string;
  metadata?: any;
  created_at: string;
  performed_by?: string;
}

export function ComplianceAuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  const { data: auditEvents, isLoading } = useQuery({
    queryKey: ['compliance-audit-trail', searchTerm, eventTypeFilter],
    queryFn: async () => {
      // Get audit data from compliance_audit_events table
      const { data, error } = await supabase
        .from('compliance_audit_events')
        .select(`
          id,
          event_type,
          user_id,
          user_name,
          target_user_id,
          target_user_name,
          description,
          metadata,
          created_at,
          performed_by
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching audit events:', error);
        // Return empty array instead of throwing to prevent UI crash
        return [];
      }

      return data || [];
    }
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'compliance_update':
        return <Shield className="h-4 w-4" />;
      case 'document_upload':
        return <FileText className="h-4 w-4" />;
      case 'user_action':
        return <User className="h-4 w-4" />;
      case 'system_change':
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'compliance_update':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Compliance</Badge>;
      case 'document_upload':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Document</Badge>;
      case 'user_action':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">User Action</Badge>;
      case 'system_change':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">System</Badge>;
      default:
        return <Badge variant="outline">Event</Badge>;
    }
  };

  const filteredEvents = auditEvents?.filter(event => {
    const matchesSearch = event.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.target_user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    return matchesSearch && matchesFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance Audit Trail</h3>
          <p className="text-sm text-muted-foreground">
            Track all compliance-related activities and system changes
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="all">All Events</option>
            <option value="compliance_update">Compliance Updates</option>
            <option value="document_upload">Document Uploads</option>
            <option value="user_action">User Actions</option>
            <option value="system_change">System Changes</option>
          </select>
        </div>
      </div>

      {/* Audit Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Compliance Activity
          </CardTitle>
          <CardDescription>
            Comprehensive log of all compliance-related activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading audit trail...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit events found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.event_type)}
                        <span className="font-medium">#{event.id.slice(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {event.user_name || 'System User'}
                    </TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell>{getEventBadge(event.event_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(event.created_at).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
