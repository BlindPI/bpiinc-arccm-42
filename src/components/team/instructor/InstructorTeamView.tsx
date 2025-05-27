
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { Users, BookOpen, Award } from 'lucide-react';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';

export function InstructorTeamView() {
  const { user } = useAuth();
  const { data: userTeams = [], isLoading, error } = useTeamMemberships();

  console.log('InstructorTeamView: Component render - userTeams:', userTeams, 'isLoading:', isLoading, 'error:', error);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading your teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Error loading teams: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teams Joined</p>
                <p className="text-2xl font-bold">{userTeams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admin Roles</p>
                <p className="text-2xl font-bold">
                  {userTeams.filter(tm => tm.role === 'ADMIN').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Teams</p>
                <p className="text-2xl font-bold">
                  {userTeams.filter(tm => tm.teams?.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {userTeams.length > 0 ? (
            <div className="space-y-4">
              {userTeams.map((membership) => {
                const team = membership.teams;
                return (
                  <div key={membership.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{team?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {team?.description || 'No description'}
                        </p>
                        {team?.locations?.name && (
                          <p className="text-xs text-muted-foreground">
                            Location: {team.locations.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          membership.role === 'ADMIN' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {membership.role}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          team?.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {team?.status || 'unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Score: {team?.performance_score || 0}/100
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven't joined any teams yet</p>
              <p className="text-sm">Create a team or ask an admin to add you to one</p>
              {user?.id && (
                <p className="text-xs mt-2 font-mono">Debug: User ID is {user.id}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
