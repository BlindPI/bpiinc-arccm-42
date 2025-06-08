import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { ProviderLocationService } from '@/services/provider/providerLocationService';
import { teamManagementService } from '@/services/team/teamManagementService';
import { 
  Building2, Users, Award, TrendingUp, MapPin, Briefcase, 
  Calendar, AlertTriangle, CheckCircle, Clock 
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import type { AuthorizedProvider } from '@/services/provider/authorizedProviderService';

interface ProviderDashboardProps {
  provider: AuthorizedProvider;
}

export function ProviderDashboard({ provider }: ProviderDashboardProps) {
  const { data: kpis } = useQuery({
    queryKey: ['provider-location-kpis', provider.id],
    queryFn: () => ProviderLocationService.getProviderLocationKPIs(provider.id.toString())
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['provider-teams', provider.id],
    queryFn: () => teamManagementService.getProviderTeams(provider.id.toString())
  });

  const complianceScore = provider.compliance_score || 0;
  const performanceRating = provider.performance_rating || 0;

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Provider Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{provider.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{provider.primary_location?.name || 'No location assigned'}</span>
                </div>
              </div>
            </div>
            <Badge variant={provider.status === 'APPROVED' ? 'default' : 'secondary'} className="text-sm">
              {provider.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Provider Type</p>
                <p className="font-semibold capitalize">{provider.provider_type.replace('_', ' ')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Rating</p>
                <p className={`font-semibold ${getPerformanceColor(performanceRating)}`}>
                  {performanceRating.toFixed(1)}/5.0
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className={`font-semibold px-2 py-1 rounded text-sm ${getComplianceColor(complianceScore)}`}>
                  {complianceScore.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto p-4 flex-col gap-2">
          <Users className="h-6 w-6" />
          <span className="text-sm">Manage Teams</span>
        </Button>
        <Button variant="outline" className="h-auto p-4 flex-col gap-2">
          <Calendar className="h-6 w-6" />
          <span className="text-sm">Schedule Training</span>
        </Button>
        <Button variant="outline" className="h-auto p-4 flex-col gap-2">
          <Award className="h-6 w-6" />
          <span className="text-sm">Issue Certificates</span>
        </Button>
        <Button variant="outline" className="h-auto p-4 flex-col gap-2">
          <TrendingUp className="h-6 w-6" />
          <span className="text-sm">View Analytics</span>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Instructors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{kpis?.totalInstructors || 0}</div>
            <p className="text-sm text-green-600 mt-1">
              {kpis?.activeInstructors || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Courses Offered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{kpis?.totalCourses || 0}</div>
            <p className="text-sm text-gray-500 mt-1">At this location</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{kpis?.certificatesIssued || 0}</div>
            <p className="text-sm text-gray-500 mt-1">All time issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{teams.length}</div>
            <p className="text-sm text-gray-500 mt-1">Active teams</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Performance</span>
                <span className="text-sm text-muted-foreground">{performanceRating.toFixed(1)}/5.0</span>
              </div>
              <Progress value={(performanceRating / 5) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Compliance Score</span>
                <span className="text-sm text-muted-foreground">{complianceScore.toFixed(1)}%</span>
              </div>
              <Progress value={complianceScore} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Team Efficiency</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Instructor Certifications Expiring</p>
                  <p className="text-xs text-muted-foreground">2 certifications expire within 30 days</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Compliance Check Complete</p>
                  <p className="text-xs text-muted-foreground">All teams passed quarterly review</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Upcoming Training Sessions</p>
                  <p className="text-xs text-muted-foreground">3 sessions scheduled this week</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length > 0 ? (
            <div className="space-y-3">
              {teams.slice(0, 3).map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {team.members?.length || 0} members • {team.location?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Performance: {team.performance_score}/100
                    </p>
                  </div>
                </div>
              ))}
              
              {teams.length > 3 && (
                <Button variant="outline" className="w-full">
                  View All Teams ({teams.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No teams created yet</p>
              <p className="text-sm">Create your first team to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
