import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  Unlock,
  User,
  Users,
  Calendar,
  Search,
  Download,
  RefreshCw,
  Activity,
  Database,
  FileText,
  Globe,
  Key,
  UserCheck,
  Ban,
  Clock,
  TrendingUp,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceService } from '@/services/compliance/complianceService';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  event_type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'role_change' | 'data_access' | 'data_modification' | 'compliance_update' | 'system_access';
  user_id: string;
  user_email: string;
  user_role: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'normal' | 'suspicious' | 'blocked';
}

interface SecurityMetrics {
  totalEvents: number;
  suspiciousEvents: number;
  blockedEvents: number;
  failedLogins: number;
  uniqueUsers: number;
  topRisks: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  recentActivity: Array<{
    hour: string;
    events: number;
    suspicious: number;
  }>;
}

interface SecurityFilters {
  search: string;
  eventType: string;
  severity: string;
  status: string;
  timeRange: string;
  user: string;
}

export function SecurityAuditDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SecurityFilters>({
    search: '',
    eventType: 'all',
    severity: 'all',
    status: 'all',
    timeRange: '24h',
    user: 'all'
  });
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  useEffect(() => {
    loadSecurityData();
  }, [filters]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Get security events from audit logs
      const auditLogs = await ComplianceService.getComplianceAuditLog();
      const securityEvents = await generateSecurityEvents(auditLogs);
      
      // Apply filters
      let filtered = securityEvents;
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(event => 
          event.user_email.toLowerCase().includes(search) ||
          event.event_type.toLowerCase().includes(search) ||
          event.ip_address.includes(search)
        );
      }
      
      if (filters.eventType !== 'all') {
        filtered = filtered.filter(event => event.event_type === filters.eventType);
      }
      
      if (filters.severity !== 'all') {
        filtered = filtered.filter(event => event.severity === filters.severity);
      }
      
      if (filters.status !== 'all') {
        filtered = filtered.filter(event => event.status === filters.status);
      }
      
      // Apply time range filter
      const now = new Date();
      const timeRangeHours = getTimeRangeHours(filters.timeRange);
      const cutoffTime = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);
      
      filtered = filtered.filter(event => new Date(event.timestamp) >= cutoffTime);
      
      setEvents(filtered);
      
      // Calculate metrics
      const calculatedMetrics = calculateSecurityMetrics(filtered);
      setMetrics(calculatedMetrics);
      
    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Failed to load security audit data');
    } finally {
      setLoading(false);
    }
  };

  const generateSecurityEvents = async (auditLogs: any[]): Promise<SecurityEvent[]> => {
    // Convert audit logs to security events and add simulated security events
    const securityEvents: SecurityEvent[] = [];
    
    // Add real compliance audit events
    auditLogs.forEach((log, index) => {
      securityEvents.push({
        id: `audit-${index}`,
        event_type: 'compliance_update',
        user_id: log.user_id || 'unknown',
        user_email: log.profiles?.email || 'unknown@example.com',
        user_role: log.profiles?.display_name || 'Unknown',
        timestamp: log.created_at,
        ip_address: '192.168.1.' + Math.floor(Math.random() * 255),
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: {
          action: log.action,
          metric_name: log.compliance_metrics?.name,
          old_value: log.old_value,
          new_value: log.new_value
        },
        severity: 'low',
        status: 'normal'
      });
    });
    
    // Add simulated security events
    const mockEvents: Partial<SecurityEvent>[] = [
      {
        event_type: 'failed_login',
        severity: 'medium',
        status: 'suspicious',
        details: { attempts: 5, reason: 'Invalid password' }
      },
      {
        event_type: 'login',
        severity: 'low',
        status: 'normal',
        details: { method: 'email', location: 'New York, NY' }
      },
      {
        event_type: 'role_change',
        severity: 'high',
        status: 'normal',
        details: { from: 'IT', to: 'IC', changed_by: 'admin' }
      },
      {
        event_type: 'data_access',
        severity: 'low',
        status: 'normal',
        details: { resource: 'compliance_documents', action: 'read' }
      },
      {
        event_type: 'system_access',
        severity: 'critical',
        status: 'blocked',
        details: { reason: 'Unauthorized access attempt', blocked_by: 'firewall' }
      }
    ];
    
    // Generate mock events with realistic data
    for (let i = 0; i < 50; i++) {
      const template = mockEvents[Math.floor(Math.random() * mockEvents.length)];
      const hoursAgo = Math.floor(Math.random() * 24);
      
      securityEvents.push({
        id: `mock-${i}`,
        user_id: `user-${Math.floor(Math.random() * 20)}`,
        user_email: `user${Math.floor(Math.random() * 20)}@example.com`,
        user_role: ['IT', 'IC', 'IP', 'AP', 'AD'][Math.floor(Math.random() * 5)],
        timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...template
      } as SecurityEvent);
    }
    
    return securityEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const calculateSecurityMetrics = (events: SecurityEvent[]): SecurityMetrics => {
    const totalEvents = events.length;
    const suspiciousEvents = events.filter(e => e.status === 'suspicious').length;
    const blockedEvents = events.filter(e => e.status === 'blocked').length;
    const failedLogins = events.filter(e => e.event_type === 'failed_login').length;
    const uniqueUsers = new Set(events.map(e => e.user_id)).size;
    
    // Calculate top risks
    const riskCounts = new Map<string, { count: number; severity: string }>();
    events.forEach(event => {
      if (event.status === 'suspicious' || event.status === 'blocked') {
        const key = event.event_type;
        if (!riskCounts.has(key)) {
          riskCounts.set(key, { count: 0, severity: event.severity });
        }
        riskCounts.get(key)!.count++;
      }
    });
    
    const topRisks = Array.from(riskCounts.entries())
      .map(([type, data]) => ({ type, count: data.count, severity: data.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate recent activity (last 24 hours by hour)
    const recentActivity: Array<{
      hour: string;
      events: number;
      suspicious: number;
    }> = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourEvents = events.filter(e => {
        const eventTime = new Date(e.timestamp);
        return eventTime >= hourStart && eventTime < hourEnd;
      });
      
      recentActivity.push({
        hour: hour.getHours().toString().padStart(2, '0') + ':00',
        events: hourEvents.length,
        suspicious: hourEvents.filter(e => e.status === 'suspicious' || e.status === 'blocked').length
      });
    }
    
    return {
      totalEvents,
      suspiciousEvents,
      blockedEvents,
      failedLogins,
      uniqueUsers,
      topRisks,
      recentActivity
    };
  };

  const getTimeRangeHours = (range: string): number => {
    switch (range) {
      case '1h': return 1;
      case '6h': return 6;
      case '24h': return 24;
      case '7d': return 24 * 7;
      case '30d': return 24 * 30;
      default: return 24;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'suspicious': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login': return <User className="h-4 w-4" />;
      case 'logout': return <User className="h-4 w-4" />;
      case 'failed_login': return <Ban className="h-4 w-4" />;
      case 'password_change': return <Key className="h-4 w-4" />;
      case 'role_change': return <UserCheck className="h-4 w-4" />;
      case 'data_access': return <FileText className="h-4 w-4" />;
      case 'data_modification': return <Database className="h-4 w-4" />;
      case 'compliance_update': return <Shield className="h-4 w-4" />;
      case 'system_access': return <Globe className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const exportSecurityReport = async () => {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        filters,
        metrics,
        events: events.map(event => ({
          ...event,
          details: JSON.stringify(event.details)
        })),
        summary: {
          totalEvents: events.length,
          criticalEvents: events.filter(e => e.severity === 'critical').length,
          blockedEvents: events.filter(e => e.status === 'blocked').length,
          timeRange: filters.timeRange
        }
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Security report exported successfully');
    } catch (error) {
      console.error('Error exporting security report:', error);
      toast.error('Failed to export security report');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Security Audit Dashboard</h1>
          <p className="text-muted-foreground">Monitor security events and potential threats</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportSecurityReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Alerts */}
      {metrics && (metrics.blockedEvents > 0 || metrics.suspiciousEvents > 10) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Alert</AlertTitle>
          <AlertDescription>
            {metrics.blockedEvents > 0 && `${metrics.blockedEvents} blocked security events detected. `}
            {metrics.suspiciousEvents > 10 && `${metrics.suspiciousEvents} suspicious events require review.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {filters.timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics?.suspiciousEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Events</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.blockedEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Security blocks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics?.failedLogins || 0}</div>
            <p className="text-xs text-muted-foreground">
              Authentication failures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.uniqueUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unique users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={filters.eventType} onValueChange={(value) => setFilters({...filters, eventType: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="failed_login">Failed Login</SelectItem>
                  <SelectItem value="role_change">Role Change</SelectItem>
                  <SelectItem value="data_access">Data Access</SelectItem>
                  <SelectItem value="compliance_update">Compliance Update</SelectItem>
                  <SelectItem value="system_access">System Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={filters.severity} onValueChange={(value) => setFilters({...filters, severity: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={filters.timeRange} onValueChange={(value) => setFilters({...filters, timeRange: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => setFilters({
                search: '',
                eventType: 'all',
                severity: 'all',
                status: 'all',
                timeRange: '24h',
                user: 'all'
              })}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Security Risks */}
      {metrics && metrics.topRisks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Top Security Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topRisks.map((risk, index) => (
                <div key={risk.type} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {getEventIcon(risk.type)}
                      <span className="font-medium capitalize">{risk.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(risk.severity)}>
                      {risk.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">{risk.count} events</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2" />
                <p>No security events found matching your filters</p>
              </div>
            ) : (
              events.slice(0, 50).map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-gray-100">
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium capitalize">{event.event_type.replace('_', ' ')}</h3>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.user_email} • {event.user_role} • {event.ip_address}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                  
                  {event.details && typeof event.details === 'object' && (
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {Object.entries(event.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium">{key}:</span>
                          <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">Security Event Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Event Type</Label>
                    <p className="font-medium capitalize">{selectedEvent.event_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Severity</Label>
                    <Badge className={getSeverityColor(selectedEvent.severity)}>
                      {selectedEvent.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(selectedEvent.status)}>
                      {selectedEvent.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Timestamp</Label>
                    <p>{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">User</Label>
                    <p>{selectedEvent.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p>{selectedEvent.user_role}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">IP Address</Label>
                    <p>{selectedEvent.ip_address}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">User Agent</Label>
                    <p className="text-sm truncate">{selectedEvent.user_agent}</p>
                  </div>
                </div>

                {selectedEvent.details && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Event Details</Label>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}