import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp,
  MapPin,
  Calendar,
  Award,
  Activity,
  BookOpen,
  Target
} from 'lucide-react';
import type { EnhancedTeam } from '@/services/team/unifiedTeamService';

interface MemberTeamInterfaceProps {
  teams: EnhancedTeam[];
  onRefresh: () => void;
}

export function MemberTeamInterface({ teams, onRefresh }: MemberTeamInterfaceProps) {
  const [selectedTeam, setSelectedTeam] = useState<EnhancedTeam | null>(null);

  if (selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{selectedTeam.name}</h2>
            <p className="text-muted-foreground">
              {selectedTeam.description || 'Team activities and progress'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedTeam(null)}>
            Back to Teams
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Team Members</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{selectedTeam.member_count || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Team Performance</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{selectedTeam.performance_score || 0}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <p className="text-sm font-medium mt-1">
                    {selectedTeam.location?.name || 'Remote'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Team Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">
                      {selectedTeam.description || 'No description available for this team.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <Badge variant={selectedTeam.status === 'active' ? 'default' : 'secondary'}>
                      {selectedTeam.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Team meeting scheduled</p>
                      <p className="text-xs text-muted-foreground">Tomorrow at 2:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Award className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Training completed</p>
                      <p className="text-xs text-muted-foreground">Safety protocols certification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">New team member joined</p>
                      <p className="text-xs text-muted-foreground">Welcome to the team!</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  My Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Training Completion</span>
                      <span className="text-sm text-muted-foreground">75%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Certifications</span>
                      <span className="text-sm text-muted-foreground">3/5</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Performance Score</span>
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Team Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Training Materials</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Access course materials and documentation
                    </p>
                    <Button size="sm" variant="outline">
                      View Materials
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Team Calendar</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      View upcoming events and meetings
                    </p>
                    <Button size="sm" variant="outline">
                      Open Calendar
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Contact Directory</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Team member contact information
                    </p>
                    <Button size="sm" variant="outline">
                      View Contacts
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Support</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Get help and support resources
                    </p>
                    <Button size="sm" variant="outline">
                      Get Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            My Schedule
          </Button>
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Training
          </Button>
        </div>
        <Button variant="outline" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {/* Member Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">My Teams</span>
            </div>
            <p className="text-2xl font-bold mt-1">{teams.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Certifications</span>
            </div>
            <p className="text-2xl font-bold mt-1">3</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <p className="text-2xl font-bold mt-1">85%</p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                  {team.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {team.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {team.member_count || 0} members
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {team.performance_score || 0}%
                  </span>
                </div>

                {team.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {team.location.name}
                  </p>
                )}

                <Button 
                  onClick={() => setSelectedTeam(team)}
                  className="w-full"
                  size="sm"
                >
                  View Team
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}