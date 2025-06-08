
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AuditEntry {
  id: string;
  timestamp: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
}

export function EnterpriseAuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: auditEntries, isLoading } = useQuery({
    queryKey: ['audit-trail', searchTerm, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          timestamp,
          user_id,
          action,
          entity_type,
          entity_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          profiles(display_name)
        `)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`);
      }

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800';
    if (action.includes('update')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Enterprise Audit Trail</CardTitle>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Audit Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search audit entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create Actions</SelectItem>
                <SelectItem value="update">Update Actions</SelectItem>
                <SelectItem value="delete">Delete Actions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {auditEntries?.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge className={getActionColor(entry.action)}>
                      {entry.action.toUpperCase()}
                    </Badge>
                    <span className="font-medium">
                      {entry.profiles?.display_name || 'Unknown User'}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-sm">
                  <p className="mb-2">
                    <span className="font-medium">Entity:</span> {entry.entity_type} ({entry.entity_id})
                  </p>
                  
                  {entry.ip_address && (
                    <p className="text-xs text-muted-foreground">
                      IP: {entry.ip_address}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {(!auditEntries || auditEntries.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit entries found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
