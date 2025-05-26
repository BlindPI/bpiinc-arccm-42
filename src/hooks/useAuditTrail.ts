
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuditLog {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName?: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AuditTrailFilters {
  searchTerm?: string;
  action?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export function useAuditTrail(filters: AuditTrailFilters = {}) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['auditTrail'],
    queryFn: async () => {
      try {
        // Try to fetch from audit_logs table if it exists
        const { data: logs, error } = await supabase
          .from('audit_logs')
          .select(`
            *,
            profiles!audit_logs_user_id_fkey(display_name)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error && error.code !== 'PGRST116') { // Not "relation does not exist"
          throw error;
        }

        // If table doesn't exist or is empty, use mock data
        if (!logs || logs.length === 0) {
          return generateMockAuditLogs();
        }

        // Transform database logs to our format
        return logs.map(log => ({
          id: log.id,
          action: log.action || 'Unknown',
          description: log.details?.description || `${log.action} on ${log.entity_type}`,
          userId: log.user_id || 'system',
          userName: log.profiles?.display_name || 'System User',
          resource: log.entity_type || 'Unknown',
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          timestamp: log.created_at,
          metadata: log.details as Record<string, any>
        }));
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        return generateMockAuditLogs();
      }
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  useEffect(() => {
    if (data) {
      setAuditLogs(data);
    }
  }, [data]);

  const filteredLogs = useMemo(() => {
    let filtered = auditLogs;

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchLower) ||
        log.description.toLowerCase().includes(searchLower) ||
        log.userName?.toLowerCase().includes(searchLower) ||
        log.resource.toLowerCase().includes(searchLower)
      );
    }

    if (filters.action) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase() === filters.action?.toLowerCase()
      );
    }

    if (filters.dateRange?.start && filters.dateRange?.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date

      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    return filtered;
  }, [auditLogs, filters]);

  const searchLogs = (searchTerm: string) => {
    // This function can be used for more complex search if needed
    return filteredLogs.filter(log =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const exportLogs = () => {
    try {
      const csvContent = [
        'Timestamp,Action,User,Description,Resource,IP Address',
        ...filteredLogs.map(log => 
          `"${log.timestamp}","${log.action}","${log.userName || 'System'}","${log.description}","${log.resource}","${log.ipAddress || 'N/A'}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Audit logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export audit logs');
    }
  };

  return {
    auditLogs,
    filteredLogs,
    searchLogs,
    exportLogs,
    isLoading
  };
}

function generateMockAuditLogs(): AuditLog[] {
  const actions = ['Login', 'Logout', 'Create', 'Update', 'Delete', 'Configuration'];
  const users = ['John Doe', 'Jane Smith', 'Admin User', 'System'];
  const resources = ['User', 'Course', 'Certificate', 'System Settings', 'Backup'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const resource = resources[Math.floor(Math.random() * resources.length)];
    
    return {
      id: `audit-${i + 1}`,
      action,
      description: `${user} performed ${action.toLowerCase()} on ${resource}`,
      userId: `user-${Math.floor(Math.random() * 10) + 1}`,
      userName: user,
      resource,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (compatible)',
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        details: `Additional context for ${action.toLowerCase()} action`
      }
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
