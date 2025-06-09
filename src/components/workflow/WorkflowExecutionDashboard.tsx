
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { WorkflowAutomationService } from '@/services/governance/workflowAutomationService';
import { WorkflowApprovalService } from '@/services/governance/workflowApprovalService';
import { 
  Workflow, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Settings,
  BarChart3
} from 'lucide-react';
import { ActiveWorkflowsPanel } from './ActiveWorkflowsPanel';
import { ApprovalQueuePanel } from './ApprovalQueuePanel';
import { WorkflowSLATracker } from './WorkflowSLATracker';
import { WorkflowDefinitionManager } from './WorkflowDefinitionManager';

export function WorkflowExecutionDashboard() {
  const [activeTab, setActiveTab] = useState('active');

  const { data: workflowStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => WorkflowApprovalService.getWorkflowStats(),
    refetchInterval: 30000
  });

  const { data: pendingWorkflows = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-workflows'],
    queryFn: () => WorkflowApprovalService.getPendingWorkflows(),
    refetchInterval: 15000
  });

  const { data: workflowInstances = [], isLoading: instancesLoading } = useQuery({
    queryKey: ['workflow-instances'],
    queryFn: () => WorkflowAutomationService.getWorkflowInstances(),
    refetchInterval: 30000
  });

  return (
    <div className="space-y-6">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {statsLoading ? '...' : workflowStats.pending || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {statsLoading ? '...' : workflowStats.approved || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {statsLoading ? '...' : workflowStats.rejected || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Avg Processing</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {statsLoading ? '...' : workflowStats.avgProcessingTime || '0 days'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
          <TabsTrigger value="sla">SLA Tracking</TabsTrigger>
          <TabsTrigger value="definitions">Definitions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <ActiveWorkflowsPanel 
            workflows={workflowInstances}
            isLoading={instancesLoading}
          />
        </TabsContent>

        <TabsContent value="approvals">
          <ApprovalQueuePanel 
            pendingWorkflows={pendingWorkflows}
            isLoading={pendingLoading}
          />
        </TabsContent>

        <TabsContent value="sla">
          <WorkflowSLATracker 
            workflows={workflowInstances}
            isLoading={instancesLoading}
          />
        </TabsContent>

        <TabsContent value="definitions">
          <WorkflowDefinitionManager />
        </TabsContent>

        <TabsContent value="analytics">
          <WorkflowAnalyticsPanel stats={workflowStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface WorkflowAnalyticsPanelProps {
  stats: any;
}

function WorkflowAnalyticsPanel({ stats }: WorkflowAnalyticsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Completion Rate</span>
              <Badge variant="default">
                {Math.round((stats.approved || 0) / (stats.total || 1) * 100)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Average Processing Time</span>
              <span className="text-sm text-muted-foreground">
                {stats.avgProcessingTime || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Compliance Rate</span>
              <Badge variant="secondary">
                {stats.complianceRate || 0}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Pending</span>
              </div>
              <span className="text-sm font-medium">{stats.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Approved</span>
              </div>
              <span className="text-sm font-medium">{stats.approved || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Rejected</span>
              </div>
              <span className="text-sm font-medium">{stats.rejected || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
