import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  Activity, 
  Eye, 
  Settings,
  Calendar,
  Award,
  AlertTriangle
} from 'lucide-react';

interface TeamMember {
  id: string;
  display_name: string;
  role: string;
  status: string;
  compliance_status?: string;
}

interface EnhancedTeamCardProps {
  team: {
    id: string;
    name: string;
    description?: string;
    status: string;
    performance_score: number;
    compliance_rate: number;
    member_count: number;
    active_members: number;
    location?: {
      name: string;
      address?: string;
    };
  };
  members: TeamMember[];
  userRole: string;
  onViewDetails: () => void;
  onManageTeam?: () => void;
}

export function EnhancedTeamCard({ 
  team, 
  members, 
  userRole, 
  onViewDetails, 
  onManageTeam 
}: EnhancedTeamCardProps) {
  const canManage = ['SA', 'AD', 'AP'].includes(userRole);
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const getComplianceIcon = (rate: number) => {
    if (rate >= 95) return <Award className="h-4 w-4 text-green-600" />;
    if (rate >= 85) return <Activity className="h-4 w-4 text-blue-600" />;
    return <AlertTriangle className="h-4 w-4 text-orange-600" />;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'IC': return 'bg-blue-100 text-blue-800';
      case 'IP': return 'bg-yellow-100 text-yellow-800';
      case 'IT': return 'bg-green-100 text-green-800';
      case 'AP': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-xl font-semibold">{team.name}</CardTitle>
              <Badge 
                variant="outline" 
                className={`border ${getStatusColor(team.status)}`}
              >
                {team.status}
              </Badge>
            </div>
            
            {team.description && (
              <p className="text-sm text-muted-foreground">{team.description}</p>
            )}
            
            {team.location && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{team.location.name}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewDetails}
              className="hover:bg-primary/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            {canManage && onManageTeam && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onManageTeam}
                className="hover:bg-primary/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium">Members</p>
            </div>
            <p className="text-2xl font-bold">{team.member_count}</p>
            <p className="text-xs text-muted-foreground">
              {team.active_members} active
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-medium">Performance</p>
            </div>
            <p className={`text-2xl font-bold ${getPerformanceColor(team.performance_score)}`}>
              {team.performance_score}%
            </p>
            <p className="text-xs text-muted-foreground">
              {team.performance_score >= 90 ? 'Excellent' : 'Good'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {getComplianceIcon(team.compliance_rate)}
              <p className="text-sm font-medium">Compliance</p>
            </div>
            <p className="text-2xl font-bold">{team.compliance_rate}%</p>
            <p className="text-xs text-muted-foreground">
              {team.compliance_rate >= 95 ? 'Excellent' : 'Monitor'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium">Status</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {team.status === 'active' ? '✓' : '○'}
            </p>
            <p className="text-xs text-muted-foreground">
              {team.status === 'active' ? 'Operational' : 'Inactive'}
            </p>
          </div>
        </div>

        {/* Team Members Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Team Members</h4>
            {members.length > 4 && (
              <Button variant="ghost" size="sm" onClick={onViewDetails}>
                View All ({members.length})
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {members.slice(0, 4).map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-medium">
                      {member.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.display_name}</p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRoleColor(member.role)}`}
                      >
                        {member.role}
                      </Badge>
                      {member.compliance_status && (
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant={member.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {member.status}
                </Badge>
              </div>
            ))}
            
            {members.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No team members assigned</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}