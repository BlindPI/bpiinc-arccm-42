
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Users, 
  Building2, 
  BarChart3, 
  FileText, 
  AlertTriangle,
  Search,
  Download,
  Settings,
  Crown,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { TeamComplianceMonitor } from './TeamComplianceMonitor';
import { CrossTeamAnalytics } from './CrossTeamAnalytics';
import { EnterpriseAuditTrail } from './EnterpriseAuditTrail';
import { EnterpriseTeamOperations } from './EnterpriseTeamOperations';

export function EnterpriseTeamAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allTeams = [], isLoading } = useQuery({
    queryKey: ['enterprise-teams'],
    queryFn: () => teamManagementService.getEnhancedTeams()
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['enterprise-metrics'],
    queryFn: async () => {
      // Mock system-wide metrics
      return {
        totalTeams: allTeams.length,
        activeTeams: allTeams.filter(t => t.status === 'active').length,
        totalMembers: allTeams.reduce((sum, team) => sum + (team.members?.length || 0), 0),
        complianceScore: 87,
        criticalIssues: 3,
        pendingApprovals: 12,
        avgPerformance: 84,
        teamTypes: {
          provider_team: allTeams.filter(t => t.team_type === 'provider_team').length,
          location_team: allTeams.filter(t => t.team_type === 'location_team').length,
          project_team: allTeams.filter(t => t.team_type === 'project_team').length
        }
      };
    }
  });

  const filteredTeams = allTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.location?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enterprise Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            Enterprise Team Administration
          </h1>
          <p className="text-muted-foreground mt-2">
            System-wide team management, analytics, and compliance oversight
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </Button>
        </div>
      </div>

      {/* System Overview Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics?.totalTeams || 0}</div>
            <p className="text-xs text-gray-500 mt-1">{systemMetrics?.activeTeams || 0} active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics?.totalMembers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Across all teams</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics?.complianceScore || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">{systemMetrics?.criticalIssues || 0} critical issues</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics?.avgPerformance || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">System average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search and Team List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Teams</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTeams.map((team) => (
                  <div key={team.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <Badge className={getStatusColor(team.status)}>
                            {team.status}
                          </Badge>
                          <Badge variant="outline">
                            {team.team_type}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <div className="font-medium">{team.location?.name || 'No Location'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Members:</span>
                            <div className="font-medium">{team.members?.length || 0}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Performance:</span>
                            <div className="font-medium">{team.performance_score || 0}%</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <div className="font-medium">{new Date(team.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <CrossTeamAnalytics teams={allTeams} />
        </TabsContent>

        <TabsContent value="compliance">
          <TeamComplianceMonitor teams={allTeams} />
        </TabsContent>

        <TabsContent value="audit">
          <EnterpriseAuditTrail />
        </TabsContent>

        <TabsContent value="operations">
          <EnterpriseTeamOperations teams={allTeams} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
