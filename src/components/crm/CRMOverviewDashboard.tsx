
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CRMService } from '@/services/crm/crmService';
import { RealCRMService } from '@/services/crm/realCRMService';
import { OpportunityPipeline } from './OpportunityPipeline';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Activity,
  BarChart3 
} from 'lucide-react';

export function CRMOverviewDashboard() {
  const { data: crmStats, isLoading: statsLoading } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => CRMService.getCRMStats()
  });

  const { data: pipelineMetrics, isLoading: pipelineLoading } = useQuery({
    queryKey: ['pipeline-metrics'],
    queryFn: () => RealCRMService.getPipelineMetrics()
  });

  const { data: recentLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: async () => {
      const leads = await RealCRMService.getLeads();
      return leads.slice(0, 5);
    }
  });

  if (statsLoading || pipelineLoading || leadsLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats?.total_leads || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active prospects in pipeline
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
              ${(crmStats?.total_pipeline_value || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total opportunity value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats?.conversion_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Lead to opportunity conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats?.win_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Opportunity win percentage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
            <CardDescription>Current opportunities by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <OpportunityPipeline />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest prospects in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads?.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{lead.first_name} {lead.last_name}</h4>
                    <p className="text-sm text-muted-foreground">{lead.company_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      lead.lead_status === 'new' ? 'default' :
                      lead.lead_status === 'qualified' ? 'secondary' :
                      'outline'
                    }>
                      {lead.lead_status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Score: {lead.lead_score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pipeline Stage Analysis
          </CardTitle>
          <CardDescription>Detailed breakdown of opportunities by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pipelineMetrics?.map((stage, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">{stage.stage_name}</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Opportunities:</span>
                    <span className="font-medium">{stage.opportunity_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Value:</span>
                    <span className="font-medium">${(stage.total_value || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg. Probability:</span>
                    <span className="font-medium">{Math.round(stage.avg_probability || 0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
