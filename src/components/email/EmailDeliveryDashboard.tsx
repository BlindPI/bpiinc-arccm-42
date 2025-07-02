import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, XCircle, Clock, Mail, RefreshCw } from 'lucide-react';

interface DeliveryStats {
  total: number;
  delivered: number;
  bounced: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  bounceRate: number;
}

interface BouncedEmail {
  id: string;
  certificate_id: string;
  recipient_email: string;
  bounce_reason: string;
  timestamp: string;
  attempts: number;
}

interface DomainStats {
  domain: string;
  total: number;
  bounced: number;
  bounceRate: number;
  status: 'ok' | 'warning' | 'critical';
}

export function EmailDeliveryDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch delivery statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['email-delivery-stats'],
    queryFn: async (): Promise<DeliveryStats> => {
      const { data, error } = await supabase
        .from('certificates')
        .select('delivery_status, delivery_attempts')
        .not('delivery_status', 'is', null);

      if (error) throw error;

      const total = data.length;
      const delivered = data.filter(c => c.delivery_status === 'delivered').length;
      const bounced = data.filter(c => c.delivery_status === 'bounced').length;
      const failed = data.filter(c => c.delivery_status === 'failed').length;
      const pending = data.filter(c => c.delivery_status === 'sent' || c.delivery_status === 'pending').length;

      return {
        total,
        delivered,
        bounced,
        failed,
        pending,
        deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
        bounceRate: total > 0 ? (bounced / total) * 100 : 0
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch bounced emails
  const { data: bouncedEmails, isLoading: bouncedLoading } = useQuery({
    queryKey: ['bounced-emails'],
    queryFn: async (): Promise<BouncedEmail[]> => {
      const { data, error } = await supabase
        .from('email_delivery_events')
        .select(`
          id,
          certificate_id,
          recipient_email,
          bounce_reason,
          timestamp,
          certificates!inner(delivery_attempts)
        `)
        .eq('event_type', 'bounced')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data.map(event => ({
        id: event.id,
        certificate_id: event.certificate_id,
        recipient_email: event.recipient_email,
        bounce_reason: event.bounce_reason || 'Unknown',
        timestamp: event.timestamp,
        attempts: event.certificates?.delivery_attempts || 0
      }));
    }
  });

  // Fetch domain statistics
  const { data: domainStats, isLoading: domainLoading } = useQuery({
    queryKey: ['domain-stats'],
    queryFn: async (): Promise<DomainStats[]> => {
      const { data, error } = await supabase
        .from('email_delivery_events')
        .select('recipient_email, event_type')
        .not('recipient_email', 'is', null);

      if (error) throw error;

      // Group by domain and calculate bounce rates
      const domainMap = new Map<string, { total: number; bounced: number }>();

      data.forEach(event => {
        const domain = event.recipient_email.split('@')[1]?.toLowerCase();
        if (!domain) return;

        if (!domainMap.has(domain)) {
          domainMap.set(domain, { total: 0, bounced: 0 });
        }

        const stats = domainMap.get(domain)!;
        stats.total++;
        if (event.event_type === 'bounced') {
          stats.bounced++;
        }
      });

      return Array.from(domainMap.entries())
        .map(([domain, stats]) => {
          const bounceRate = (stats.bounced / stats.total) * 100;
          return {
            domain,
            total: stats.total,
            bounced: stats.bounced,
            bounceRate,
            status: bounceRate > 10 ? 'critical' : bounceRate > 5 ? 'warning' : 'ok'
          };
        })
        .filter(stat => stat.total >= 5) // Only show domains with at least 5 emails
        .sort((a, b) => b.bounceRate - a.bounceRate);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'bounced': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'sent': 
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDomainStatusBadge = (status: string) => {
    switch (status) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'warning': return <Badge variant="secondary">Warning</Badge>;
      case 'ok': return <Badge variant="default">OK</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Email Delivery Monitoring</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Delivery Monitoring</h2>
          <p className="text-muted-foreground">Track email delivery performance and identify issues</p>
        </div>
        <Button onClick={() => refetchStats()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Emails</span>
            </div>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Delivered</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.deliveryRate?.toFixed(1) || 0}% delivery rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Bounced</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats?.bounced || 0}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.bounceRate?.toFixed(1) || 0}% bounce rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            <div className="text-xs text-muted-foreground">In progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Rate Progress */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Performance</CardTitle>
            <CardDescription>Overall email delivery success rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Rate</span>
                  <span>{stats.deliveryRate.toFixed(1)}%</span>
                </div>
                <Progress value={stats.deliveryRate} className="mt-2" />
              </div>
              
              {stats.bounceRate > 5 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High bounce rate detected ({stats.bounceRate.toFixed(1)}%). 
                    Consider reviewing email list quality and problematic domains.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bounced">Bounced Emails</TabsTrigger>
          <TabsTrigger value="domains">Domain Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Delivery Events</CardTitle>
              <CardDescription>Latest email delivery status updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Real-time monitoring is active. Data refreshes every 30 seconds.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bounced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bounced Emails</CardTitle>
              <CardDescription>Recent email bounces and failure reasons</CardDescription>
            </CardHeader>
            <CardContent>
              {bouncedLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : bouncedEmails && bouncedEmails.length > 0 ? (
                <div className="space-y-3">
                  {bouncedEmails.map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{email.recipient_email}</span>
                          <Badge variant="outline">Attempt {email.attempts}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {email.bounce_reason}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(email.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No bounced emails found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain Analysis</CardTitle>
              <CardDescription>Email delivery performance by domain</CardDescription>
            </CardHeader>
            <CardContent>
              {domainLoading ? (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : domainStats && domainStats.length > 0 ? (
                <div className="space-y-2">
                  {domainStats.map((domain) => (
                    <div key={domain.domain} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{domain.domain}</span>
                          {getDomainStatusBadge(domain.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {domain.bounced} bounced out of {domain.total} emails
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {domain.bounceRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">bounce rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No domain data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}