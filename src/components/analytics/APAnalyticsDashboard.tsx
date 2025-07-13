import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MapPin, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Building,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';

export default function APAnalyticsDashboard() {
  const providerMetrics = {
    assignedLocations: 8,
    totalTeams: 12,
    activeCertifications: 45,
    complianceScore: 94.2,
    monthlyTrainingHours: 324,
    recentAchievements: 6
  };

  const locationPerformance = [
    { name: 'Downtown Training Center', compliance: 98, teams: 3, status: 'excellent' },
    { name: 'North Campus Facility', compliance: 92, teams: 2, status: 'good' },
    { name: 'Industrial Training Hub', compliance: 89, teams: 4, status: 'good' },
    { name: 'Remote Learning Center', compliance: 85, teams: 3, status: 'needs_attention' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{providerMetrics.assignedLocations}</div>
            <p className="text-xs text-muted-foreground">
              Actively managing training facilities
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams Under Management</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{providerMetrics.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              Cross-functional training teams
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{providerMetrics.complianceScore}%</div>
            <p className="text-xs text-muted-foreground">
              Above industry standard
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{providerMetrics.activeCertifications}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Hours</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{providerMetrics.monthlyTrainingHours}</div>
            <p className="text-xs text-muted-foreground">
              This month delivered
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Achievements</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{providerMetrics.recentAchievements}</div>
            <p className="text-xs text-muted-foreground">
              Milestones reached this quarter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Location Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Location Performance Overview</span>
          </CardTitle>
          <CardDescription>
            Compliance and team performance across your assigned facilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locationPerformance.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{location.name}</h4>
                    <Badge className={getStatusColor(location.status)}>
                      {location.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Compliance: </span>
                      <span className="font-medium">{location.compliance}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Teams: </span>
                      <span className="font-medium">{location.teams}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={location.compliance} className="h-2" />
                  </div>
                </div>
                <div className="ml-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Provider Management Actions</span>
          </CardTitle>
          <CardDescription>
            Common tasks and oversight functions for authorized providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">Manage Teams</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Award className="h-5 w-5" />
              <span className="text-sm">View Certifications</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Performance Reports</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">Compliance Review</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert Summary */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span>Attention Required</span>
          </CardTitle>
          <CardDescription>
            Items requiring your immediate review or action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded bg-yellow-50 border border-yellow-200">
              <div>
                <p className="font-medium text-yellow-900">Remote Learning Center</p>
                <p className="text-sm text-yellow-700">Compliance score below threshold (85%)</p>
              </div>
              <Button variant="outline" size="sm">
                Review
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-blue-50 border border-blue-200">
              <div>
                <p className="font-medium text-blue-900">Quarterly Compliance Report</p>
                <p className="text-sm text-blue-700">Due in 5 days - 78% complete</p>
              </div>
              <Button variant="outline" size="sm">
                Continue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}