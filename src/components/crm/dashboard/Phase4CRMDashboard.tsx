/**
 * Phase 4 Enhanced CRM Dashboard
 * Real-time, performance-optimized CRM dashboard with unified service integration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Mail, 
  Activity,
  BarChart3,
  RefreshCw,
  Search,
  Plus,
  Filter,
  Download,
  Settings,
  Bell,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

// Import Phase 4 services
import { Phase4CRMService } from '@/services/crm/phase4ServiceIntegration';
import { EnhancedEmailCampaignService } from '@/services/email/enhancedEmailCampaignService';

// Import existing components for integration
import { LeadsTable } from '@/components/crm/LeadsTable';
import { OpportunityPipeline } from '@/components/crm/OpportunityPipeline';
import { ContactsTable } from '@/components/crm/contacts/ContactsTable';
import { ActivitiesTable } from '@/components/crm/ActivitiesTable';
import { CreateLeadModal } from '@/components/crm/leads/CreateLeadModal';

interface DashboardMetrics {
  totalLeads: number;
  totalOpportunities: number;
  totalContacts: number;
  totalActivities: number;
  conversionRate: number;
  pipelineValue: number;
  recentActivities: number;
  emailCampaigns: number;
}

export function Phase4CRMDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const queryClient = useQueryClient();

  // Enhanced CRM Stats with Performance Metrics
  const { 
    data: crmStats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['phase4-crm-stats'],
    queryFn: () => Phase4CRMService.getCRMStatsWithPerformanceMetrics(),
    refetchInterval: realTimeEnabled ? 30000 : false, // 30 seconds if real-time enabled
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Real-time Activity Feed
  const { 
    data: activityFeed, 
    isLoading: activitiesLoading 
  } = useQuery({
    queryKey: ['phase4-activity-feed'],
    queryFn: () => Phase4CRMService.getRealtimeActivityFeed(10),
    refetchInterval: realTimeEnabled ? 15000 : false, // 15 seconds
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Service Integration Validation
  const { data: serviceValidation } = useQuery({
    queryKey: ['phase4-service-validation'],
    queryFn: () => Phase4CRMService.validateServiceIntegration(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Dashboard metrics calculation
  const dashboardMetrics: DashboardMetrics = useMemo(() => {
    if (!crmStats) {
      return {
        totalLeads: 0,
        totalOpportunities: 0,
        totalContacts: 0,
        totalActivities: 0,
        conversionRate: 0,
        pipelineValue: 0,
        recentActivities: 0,
        emailCampaigns: 0
      };
    }

    return {
      totalLeads: crmStats.total_leads || 0,
      totalOpportunities: crmStats.total_opportunities || 0,
      totalContacts: (crmStats as any).total_contacts || 0,
      totalActivities: crmStats.total_activities || 0,
      conversionRate: crmStats.conversion_rate || 0,
      pipelineValue: crmStats.total_pipeline_value || 0,
      recentActivities: activityFeed?.activities?.length || 0,
      emailCampaigns: 0 // Would be calculated from email campaigns
    };
  }, [crmStats, activityFeed]);

  // Real-time toggle handler
  const handleRealTimeToggle = () => {
    setRealTimeEnabled(!realTimeEnabled);
    toast.success(
      realTimeEnabled 
        ? 'Real-time updates disabled' 
        : 'Real-time updates enabled'
    );
  };

  // Manual refresh handler
  const handleManualRefresh = async () => {
    try {
      await Promise.all([
        refetchStats(),
        queryClient.invalidateQueries({ queryKey: ['phase4-activity-feed'] })
      ]);
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    }
  };

  // Performance indicator component
  const PerformanceIndicator = () => {
    if (!crmStats?.performance) return null;

    const { queryTime, cacheHit, lastUpdated } = crmStats.performance;
    const performanceColor = queryTime < 500 ? 'green' : queryTime < 1000 ? 'yellow' : 'red';

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className={`w-2 h-2 rounded-full bg-${performanceColor}-500`} />
        <span>Query: {queryTime.toFixed(0)}ms</span>
        {cacheHit && <Badge variant="secondary" className="text-xs">Cached</Badge>}
        <span>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
      </div>
    );
  };

  // Service status indicator
  const ServiceStatusIndicator = () => {
    if (!serviceValidation) return null;

    const allServicesHealthy = Object.values(serviceValidation).every(status => status);
    
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${allServicesHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-muted-foreground">
          Services: {allServicesHealthy ? 'Healthy' : 'Issues Detected'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phase 4 CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Enhanced real-time customer relationship management with unified service integration
          </p>
          <div className="flex items-center gap-4 mt-2">
            <PerformanceIndicator />
            <ServiceStatusIndicator />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search CRM data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRealTimeToggle}
            className={realTimeEnabled ? 'bg-green-50 border-green-200' : ''}
          >
            <Zap className={`h-4 w-4 mr-2 ${realTimeEnabled ? 'text-green-600' : ''}`} />
            Real-time {realTimeEnabled ? 'ON' : 'OFF'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={() => setShowCreateLead(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardMetrics.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
          {realTimeEnabled && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.totalOpportunities}</div>
            <p className="text-xs text-muted-foreground">
              ${dashboardMetrics.pipelineValue.toLocaleString()} pipeline value
            </p>
          </CardContent>
          {realTimeEnabled && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Active customer relationships
            </p>
          </CardContent>
          {realTimeEnabled && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.recentActivities}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
          {realTimeEnabled && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Activity Feed
                  {realTimeEnabled && (
                    <Badge variant="secondary" className="ml-2">Live</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Latest activities across all CRM entities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityFeed?.activities?.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.activity_type} • {new Date(activity.activity_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  System performance and service health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceValidation && (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(serviceValidation).map(([service, status]) => (
                        <div key={service} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-sm capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {crmStats?.performance && (
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Query Time:</span>
                          <span className="ml-2 font-medium">{crmStats.performance.queryTime.toFixed(0)}ms</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cache Status:</span>
                          <span className="ml-2 font-medium">
                            {crmStats.performance.cacheHit ? 'Hit' : 'Miss'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>
                Manage and track your sales leads with enhanced workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Pipeline</CardTitle>
              <CardDescription>
                Track opportunities through your sales pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OpportunityPipeline />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Contact Management</CardTitle>
              <CardDescription>
                Manage your customer and prospect contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactsTable
                contacts={[]}
                isLoading={false}
                onCreateContact={() => {}}
                onUpdateContact={() => {}}
                onDeleteContact={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Management</CardTitle>
              <CardDescription>
                Track all customer interactions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivitiesTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Lead Modal */}
      <CreateLeadModal
        open={showCreateLead}
        onOpenChange={setShowCreateLead}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['phase4-crm-stats'] });
          queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        }}
      />
    </div>
  );
}

export default Phase4CRMDashboard;