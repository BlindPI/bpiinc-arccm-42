
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Calendar,
  User,
  MapPin
} from 'lucide-react';

export function StudentTeamView() {
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
            Teams you're part of and training groups
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
            <h3 className="text-lg font-medium mb-2">No Team Memberships</h3>
            <p className="text-muted-foreground mb-4">
              You haven't joined any teams yet. Contact your administrator to get added to a team.
            </p>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
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
                  <Badge variant="secondary">
                    Member
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {teamMembership.teams?.description || 'No description available'}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <div className="font-medium">
                          None
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">Position:</span>
                        <div className="font-medium">
                          {teamMembership.team_position || 'Team Member'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">Joined:</span>
                        <div className="font-medium">
                          {teamMembership.assignment_start_date 
                            ? new Date(teamMembership.assignment_start_date).toLocaleDateString()
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <BookOpen className="h-4 w-4 mr-1" />
                      View Training
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Team Chat
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Track Your Progress</h3>
            <p>Your learning progress and team activities will be displayed here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
