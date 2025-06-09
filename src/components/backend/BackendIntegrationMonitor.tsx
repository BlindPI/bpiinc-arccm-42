
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  RefreshCw,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { BackendIntegrationService, BackendFunction } from '@/services/backend/backendIntegrationService';
import { toast } from 'sonner';

export function BackendIntegrationMonitor() {
  const [initializationStatus, setInitializationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');

  const { data: functionStatus = [], isLoading, refetch } = useQuery({
    queryKey: ['backend-function-status'],
    queryFn: () => BackendIntegrationService.getBackendFunctionStatus(),
    refetchInterval: 30000
  });

  const handleInitializeIntegrations = async () => {
    setInitializationStatus('running');
    try {
      await BackendIntegrationService.initializeAllIntegrations();
      setInitializationStatus('completed');
      toast.success('Backend integrations initialized successfully');
      refetch();
    } catch (error) {
      setInitializationStatus('error');
      toast.error('Failed to initialize backend integrations');
      console.error('Integration error:', error);
    }
  };

  const connectedFunctions = functionStatus.filter(f => f.isConnected);
  const disconnectedFunctions = functionStatus.filter(f => !f.isConnected);
  const connectionPercentage = functionStatus.length > 0 ? (connectedFunctions.length / functionStatus.length) * 100 : 0;

  const getCategoryFunctions = (category: string) => {
    const categoryMap: Record<string, string[]> = {
      'CRM': ['calculate_enhanced_lead_score', 'assign_lead_intelligent', 'qualify_lead_automatically', 'execute_lead_workflow', 'calculate_campaign_roi', 'auto_convert_qualified_leads'],
      'Team Management': ['get_enhanced_teams_data', 'get_team_analytics_summary', 'calculate_team_performance_metrics', 'update_team_performance_scores'],
      'Compliance': ['get_compliance_metrics', 'calculate_compliance_risk_score', 'check_member_compliance', 'check_compliance_rules'],
      'Workflow': ['get_workflow_statistics', 'initiate_workflow', 'check_workflow_slas'],
      'Instructor': ['get_instructor_performance_metrics', 'get_executive_dashboard_metrics'],
      'Cache': ['get_cache_entry', 'set_cache_entry', 'cleanup_expired_cache', 'invalidate_cache_by_tags'],
      'Analytics': ['get_cross_team_analytics', 'get_enterprise_team_metrics', 'calculate_analytics_warehouse_metrics', 'update_realtime_metrics', 'refresh_all_revenue_analytics'],
      'Audit': ['log_team_lifecycle_event']
    };

    return functionStatus.filter(f => categoryMap[category]?.includes(f.name) || false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Backend Integration Monitor
          </h1>
          <p className="text-muted-foreground">
            Phase 2: Backend Integration - Connect unused functions to frontend
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={handleInitializeIntegrations}
            disabled={initializationStatus === 'running'}
            variant={initializationStatus === 'completed' ? 'default' : 'outline'}
          >
            {initializationStatus === 'running' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Initialize All Integrations
          </Button>
          
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Integration Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Backend Functions Connected</span>
                <span className="text-sm text-muted-foreground">
                  {connectedFunctions.length}/{functionStatus.length}
                </span>
              </div>
              <Progress value={connectionPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Connected: {connectedFunctions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Disconnected: {disconnectedFunctions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Status: {initializationStatus}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Function Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {['CRM', 'Team Management', 'Compliance', 'Workflow', 'Instructor', 'Cache', 'Analytics', 'Audit'].map((category) => {
          const categoryFunctions = getCategoryFunctions(category);
          const connectedCount = categoryFunctions.filter(f => f.isConnected).length;
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category} Functions</span>
                  <Badge variant={connectedCount === categoryFunctions.length ? 'default' : 'secondary'}>
                    {connectedCount}/{categoryFunctions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryFunctions.map((func) => (
                    <div key={func.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{func.name}</div>
                        <div className="text-xs text-muted-foreground">{func.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {func.isConnected ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={func.isConnected ? 'default' : 'destructive'}>
                          {func.isConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Critical Issues */}
      {disconnectedFunctions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Critical Issues - Disconnected Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {disconnectedFunctions.slice(0, 5).map((func) => (
                <div key={func.name} className="flex items-center gap-2 text-sm">
                  <XCircle className="h-3 w-3 text-red-600" />
                  <span className="font-medium">{func.name}</span>
                  <span className="text-muted-foreground">- {func.description}</span>
                </div>
              ))}
              {disconnectedFunctions.length > 5 && (
                <div className="text-sm text-muted-foreground">
                  ...and {disconnectedFunctions.length - 5} more functions need connection
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
