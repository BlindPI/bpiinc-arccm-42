
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';

export function PerformanceInsights() {
  const insights = [
    {
      title: 'Lead Conversion Rate',
      value: '24.5%',
      change: '+3.2%',
      trend: 'up',
      description: 'Higher than last month',
      progress: 75,
      status: 'good'
    },
    {
      title: 'Average Deal Size',
      value: '$125,000',
      change: '-5.1%',
      trend: 'down',
      description: 'Slightly below target',
      progress: 60,
      status: 'warning'
    },
    {
      title: 'Sales Cycle Length',
      value: '45 days',
      change: '-12%',
      trend: 'up',
      description: 'Improved efficiency',
      progress: 80,
      status: 'good'
    },
    {
      title: 'Pipeline Velocity',
      value: '$2.1M/month',
      change: '+18%',
      trend: 'up',
      description: 'Strong momentum',
      progress: 90,
      status: 'excellent'
    }
  ];

  const teamPerformance = [
    { name: 'Sarah Johnson', deals: 12, revenue: 450000, conversion: 28 },
    { name: 'Mike Chen', deals: 8, revenue: 320000, conversion: 22 },
    { name: 'Emily Davis', deals: 15, revenue: 520000, conversion: 31 },
    { name: 'Alex Wilson', deals: 6, revenue: 180000, conversion: 18 }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Award className="h-4 w-4 text-green-500" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {insight.title}
                </CardTitle>
                {getStatusIcon(insight.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{insight.value}</span>
                  <div className="flex items-center gap-1">
                    {insight.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      insight.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {insight.change}
                    </span>
                  </div>
                </div>
                <Progress value={insight.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{insight.description}</p>
                <Badge variant="outline" className={getStatusColor(insight.status)}>
                  {insight.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance
          </CardTitle>
          <CardDescription>
            Individual team member performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamPerformance.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-blue-600">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {member.deals} deals • ${member.revenue.toLocaleString()} revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{member.conversion}%</div>
                  <div className="text-sm text-muted-foreground">Conversion Rate</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
          <CardDescription>
            Data-driven recommendations to improve performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Opportunity Identified</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your lead qualification rate has improved by 15%. Consider increasing your lead generation efforts to capitalize on this efficiency gain.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Action Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  3 high-value deals have been in negotiation stage for over 30 days. Consider reaching out to accelerate the decision process.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <Award className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Best Practice</h4>
                <p className="text-sm text-green-700 mt-1">
                  Deals with 3+ touchpoints in the first week have 40% higher close rates. Maintain this follow-up cadence for new opportunities.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
