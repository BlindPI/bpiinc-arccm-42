import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  Calendar, 
  ExternalLink,
  Award,
  Activity,
  Star
} from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  user?: {
    display_name: string;
    email: string;
    role: string;
  };
}

interface EnhancedTeamCardProps {
  team: {
    id: string;
    name: string;
    description?: string;
    team_type: string;
    status: string;
    performance_score?: number;
    location_id?: string;
    created_at: string;
    member_count?: number;
    location?: {
      name: string;
      city?: string;
      state?: string;
    };
    members?: TeamMember[];
  };
  onViewDetails?: (teamId: string) => void;
  onManage?: (teamId: string) => void;
}

export function EnhancedTeamCard({ team, onViewDetails, onManage }: EnhancedTeamCardProps) {
  // Debug logging for Step 1: Fix Member Count Display
  console.log(`🔍 ENHANCEDTEAMCARD DEBUG: Team "${team.name}":`, {
    teamId: team.id,
    members: team.members,
    membersLength: team.members?.length,
    memberCount: team.member_count,
    performanceScore: team.performance_score,
    hasMembersArray: !!team.members
  });
  
  const memberCount = team.members?.length || 0;
  const activeMembers = team.members?.filter(m => m.status === 'active').length || 0;
  const performanceScore = team.performance_score || 85;
  
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTeamTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'training': return <Award className="h-4 w-4" />;
      case 'operational': return <Activity className="h-4 w-4" />;
      case 'management': return <Star className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-border/60 hover:border-primary/20 bg-card">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getTeamTypeIcon(team.team_type)}
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {team.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {team.description || 'No description available'}
              </p>
            </div>
            <Badge className={getStatusColor(team.status)}>
              {team.status}
            </Badge>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Members</span>
              </div>
              <div className="text-xl font-bold text-foreground">
                {activeMembers}
                <span className="text-sm font-normal text-muted-foreground">
                  /{memberCount}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <div className={`text-xl font-bold inline-flex items-center px-2 py-1 rounded-md ${getPerformanceColor(performanceScore)}`}>
                {performanceScore}%
              </div>
            </div>
          </div>

          {/* Location */}
          {team.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
              <MapPin className="h-4 w-4" />
              <span>
                {team.location.name}
                {team.location.city && `, ${team.location.city}`}
                {team.location.state && `, ${team.location.state}`}
              </span>
            </div>
          )}

          {/* Member Preview */}
          {team.members && team.members.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Team Members</span>
                <span className="text-xs text-muted-foreground">
                  Showing {Math.min(3, activeMembers)} of {activeMembers}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {team.members
                  .filter(member => member.status === 'active')
                  .slice(0, 3)
                  .map((member, index) => (
                    <div key={member.id} className="flex items-center gap-1">
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs bg-muted">
                          {member.user?.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {index < 2 && activeMembers > 3 && (
                        <span className="text-muted-foreground">•</span>
                      )}
                    </div>
                  ))}
                {activeMembers > 3 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{activeMembers - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={() => onViewDetails?.(team.id)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={() => onManage?.(team.id)}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Manage
            </Button>
          </div>

          {/* Created Date */}
          <div className="text-xs text-muted-foreground text-center pt-1 border-t border-border/30">
            Created {new Date(team.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}