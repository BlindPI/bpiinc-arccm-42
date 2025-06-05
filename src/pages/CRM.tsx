
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

// Load console test script
if (typeof window !== 'undefined') {
  import('@/utils/crmConsoleTest.js').catch(() => {
    // Script loading is optional
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
              Diagnose CRM database connection issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={runDebugTest}
                disabled={isDebugging}
                variant="outline"
                size="sm"
              >
                {isDebugging ? 'Testing...' : 'Test CRM Insert'}
              </Button>
            </div>
            
            {debugResults && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Debug Results:</h4>
                <div className={`p-3 rounded text-sm ${debugResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-medium">
                    {debugResults.success ? '✅ SUCCESS' : '❌ FAILED'}
                  </div>
                  {debugResults.error && (
                    <div className="mt-2">
                      <div><strong>Error:</strong> {debugResults.error}</div>
                      {debugResults.details?.code && (
                        <div><strong>Code:</strong> {debugResults.details.code}</div>
                      )}
                      {debugResults.details?.message && (
                        <div><strong>Message:</strong> {debugResults.details.message}</div>
                      )}
                    </div>
                  )}
                  {debugResults.success && debugResults.testRecord && (
                    <div className="mt-2">
                      <div><strong>Test Record Created:</strong> {debugResults.testRecord.id}</div>
                    </div>
                  )}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Full Debug Output</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(debugResults, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Tabs */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Recent Leads</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>
                Your newest leads and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLeads?.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.email} • {lead.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                        {lead.status}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {(!recentLeads || recentLeads.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No leads found. Start by adding your first lead.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Opportunities</CardTitle>
              <CardDescription>
                Opportunities in your pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOpportunities?.slice(0, 5).map((opportunity) => (
                  <div key={opportunity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Target className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{opportunity.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(opportunity.value)} • {opportunity.account_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{opportunity.stage}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/crm/opportunities')}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {(!recentOpportunities || recentOpportunities.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No opportunities found. Create your first opportunity.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Activities</CardTitle>
              <CardDescription>
                Your pending tasks and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities?.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.type} • {activity.due_date ? new Date(activity.due_date).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={activity.completed ? 'default' : 'secondary'}>
                        {activity.completed ? 'Done' : 'Pending'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/crm/activities')}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {(!recentActivities || recentActivities.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending activities. You're all caught up!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
