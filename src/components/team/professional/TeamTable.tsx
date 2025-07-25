
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, MapPin, TrendingUp, MoreVertical, Settings, UserCheck, Eye } from 'lucide-react';
import type { SimpleTeam } from '@/types/simplified-team-management';

interface TeamTableProps {
  teams: SimpleTeam[];
  onTeamSelect?: (team: SimpleTeam) => void;
  canManage: boolean;
}

export function TeamTable({ 
  teams, 
  onTeamSelect,
  canManage 
}: TeamTableProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams ({teams.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length > 0 ? (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <Badge className={getStatusColor(team.status)}>
                            {team.status}
                          </Badge>
                          {team.team_type && (
                            <Badge variant="outline">
                              {team.team_type.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        
                        {team.description && (
                          <p className="text-sm text-muted-foreground mb-2">{team.description}</p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{team.member_count} members</span>
                          </div>
                          
                          {team.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{team.location.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>Score: {team.performance_score || 0}/100</span>
                          </div>
                          
                          <span>Created: {new Date(team.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onTeamSelect && (
                      <Button
                        variant="outline"
                        onClick={() => onTeamSelect(team)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                    
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Manage Members
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Team Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
            <p className="text-muted-foreground">
              Create your first team to get started with team management.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
