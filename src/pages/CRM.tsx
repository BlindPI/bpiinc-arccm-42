
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Target, Activity, DollarSign, TrendingUp, Users, Calendar, Bug } from 'lucide-react';
import { CRMService } from '@/services/crm/crmService';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { runAllCRMTests, testCRMFullInsert } from '@/utils/crmDebugTest';

// Load console test script and debug utilities
if (typeof window !== 'undefined') {
  import('@/utils/crmConsoleTest.js').catch(() => {
    // Script loading is optional
  });
  import('@/utils/debugCrmDates').catch(() => {
    // Debug utilities loading is optional
  });
  import('@/utils/testLeadConversion').catch(() => {
    // Test utilities loading is optional
  });
  import('@/utils/initializeCRMNavigation').catch(() => {
    // CRM navigation initialization is optional
  });
}

export default function CRM() {
  const navigate = useNavigate();
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const { data: crmStats, isLoading } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: CRMService.getCRMStats
  });

  const { data: recentLeads } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => CRMService.getLeads()
  });

  const { data: recentOpportunities } = useQuery({
    queryKey: ['recent-opportunities'],
    queryFn: () => CRMService.getOpportunities()
  });

  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => CRMService.getActivities({ completed: false })
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const runDebugTest = async () => {
    setIsDebugging(true);
    try {
      console.log('🔍 Running CRM debug test...');
      const results = await testCRMFullInsert();
      setDebugResults(results);
      console.log('Debug results:', results);
    } catch (error) {
      console.error('Debug test failed:', error);
      setDebugResults({ error: 'Debug test failed', details: error });
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Manage leads, opportunities, and customer relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/crm/leads')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <Button variant="outline" onClick={() => navigate('/crm/opportunities')}>
            <Target className="h-4 w-4 mr-2" />
            New Opportunity
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Bug className="h-4 w-4 mr-2" />
            Debug
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats?.totalOpportunities || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(crmStats?.pipelineValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats?.totalActivities || 0}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">CRM Debug Panel</CardTitle>
            <CardDescription className="text-red-600">
              Debug and test CRM functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runDebugTest} 
              disabled={isDebugging}
              variant="destructive"
            >
              {isDebugging ? 'Running Test...' : 'Run Debug Test'}
            </Button>
            {debugResults && (
              <div className="mt-4 p-4 bg-white rounded border">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(debugResults, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest lead submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads?.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                    <p className="text-sm text-muted-foreground">{lead.company_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={lead.lead_status === 'new' ? 'default' : 'secondary'}>
                      {lead.lead_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Opportunities</CardTitle>
            <CardDescription>Active opportunities in pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOpportunities?.slice(0, 5).map((opportunity) => (
                <div key={opportunity.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{opportunity.opportunity_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(opportunity.estimated_value)} • {opportunity.stage}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {opportunity.probability}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
