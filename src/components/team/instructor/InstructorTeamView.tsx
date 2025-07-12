
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  Award,
  MessageSquare,
  Clock
} from 'lucide-react';

export function InstructorTeamView() {
  const { data: userTeams = [], isLoading } = useTeamMemberships();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">My Teams</h3>
          <p className="text-sm text-muted-foreground">
            Teams where you serve as instructor or team member
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {userTeams.length} Teams
        </Badge>
      </div>

      {userTeams.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Team Assignments</h3>
            <p className="text-muted-foreground">
              You haven't been assigned to any teams yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {userTeams.map((teamMembership) => (
            <Card key={teamMembership.team_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {teamMembership.teams?.name || 'Team'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={teamMembership.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {teamMembership.role}
                    </Badge>
                    {teamMembership.team_position && (
                      <Badge variant="outline">
                        {teamMembership.team_position}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team Info */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {teamMembership.teams?.description || 'No description available'}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">
                          {teamMembership.teams?.locations?.name || 'None'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Assignment Start:</span>
                        <span className="font-medium">
                          {teamMembership.assignment_start_date 
                            ? new Date(teamMembership.assignment_start_date).toLocaleDateString()
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="flex flex-col h-16">
                        <Calendar className="h-4 w-4 mb-1" />
                        <span className="text-xs">Schedule</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex flex-col h-16">
                        <BookOpen className="h-4 w-4 mb-1" />
                        <span className="text-xs">Training</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex flex-col h-16">
                        <MessageSquare className="h-4 w-4 mb-1" />
                        <span className="text-xs">Chat</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex flex-col h-16">
                        <Award className="h-4 w-4 mb-1" />
                        <span className="text-xs">Assess</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructor Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
            <p>Your team activities and interactions will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
