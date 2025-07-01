import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { TeamAnalyticsService } from '@/services/team/teamAnalyticsService';
import { useQuery } from '@tanstack/react-query';

interface ComplianceMetric {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  completionRate: number;
  status: 'compliant' | 'at_risk' | 'non_compliant';
  lastUpdated: string;
  membersCompliant: number;
  totalMembers: number;
  requirements: {
    completed: number;
    total: number;
    overdue: number;
  };
}

interface ComplianceAlert {
  id: string;
  teamId: string;
  teamName: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  actionRequired: boolean;
  dueDate?: string;
}

export function TeamComplianceMonitor() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'compliant' | 'at_risk' | 'non_compliant'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock function to simulate fetching compliance metrics
  const fetchComplianceMetrics = async (): Promise<ComplianceMetric[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data for compliance metrics
    const mockMetrics: ComplianceMetric[] = [
      {
        id: '1',
        name: 'Team A',
        teamId: 'team-a',
        teamName: 'Team Alpha',
        completionRate: 95,
        status: 'compliant',
        lastUpdated: new Date().toISOString(),
        membersCompliant: 22,
        totalMembers: 23,
        requirements: { completed: 45, total: 45, overdue: 0 }
      },
      {
        id: '2',
        name: 'Team B',
        teamId: 'team-b',
        teamName: 'Team Beta',
        completionRate: 70,
        status: 'at_risk',
        lastUpdated: new Date().toISOString(),
        membersCompliant: 15,
        totalMembers: 22,
        requirements: { completed: 38, total: 45, overdue: 2 }
      },
      {
        id: '3',
        name: 'Team C',
        teamId: 'team-c',
        teamName: 'Team Gamma',
        completionRate: 50,
        status: 'non_compliant',
        lastUpdated: new Date().toISOString(),
        membersCompliant: 10,
        totalMembers: 20,
        requirements: { completed: 25, total: 45, overdue: 5 }
      }
    ];

    return mockMetrics;
  };

  // Mock function to simulate fetching compliance alerts
  const fetchComplianceAlerts = async (): Promise<ComplianceAlert[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data for compliance alerts
    const mockAlerts: ComplianceAlert[] = [
      {
        id: '1',
        teamId: 'team-b',
        teamName: 'Team Beta',
        severity: 'medium',
        message: 'Compliance rate below 80%',
        actionRequired: true,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        teamId: 'team-c',
        teamName: 'Team Gamma',
        severity: 'high',
        message: 'Multiple overdue compliance requirements',
        actionRequired: true
      }
    ];

    return mockAlerts;
  };

  // Fetch compliance metrics using react-query
  const { data: complianceMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: fetchComplianceMetrics,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: true
  });

  // Fetch compliance alerts using react-query
  const { data: complianceAlerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['compliance-alerts'],
    queryFn: fetchComplianceAlerts,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: true
  });

  // Filter compliance metrics based on selected filter
  const filteredMetrics = complianceMetrics?.filter(metric => {
    if (selectedFilter === 'all') return true;
    return metric.status === selectedFilter;
  }) || [];

  // Function to handle refreshing data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMetrics(), refetchAlerts()]);
    setRefreshing(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Compliance Monitor</h2>
          <p className="text-muted-foreground">
            Monitor compliance status across all teams and locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshing(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant Teams</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">18</div>
            <p className="text-xs text-muted-foreground">
              75% compliance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">4</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">2</div>
            <p className="text-xs text-muted-foreground">
              Immediate action needed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mock compliance monitoring interface */}
      <Card>
        <CardHeader>
          <CardTitle>Team Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Team compliance monitoring interface</p>
            <p className="text-sm">Real-time compliance tracking across all teams</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
