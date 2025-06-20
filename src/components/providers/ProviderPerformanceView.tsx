
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Award, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProviderPerformanceViewProps {
  providerId: string;
}

export function ProviderPerformanceView({ providerId }: ProviderPerformanceViewProps) {
  const { data: providerData, isLoading } = useQuery({
    queryKey: ['provider-performance', providerId],
    queryFn: async () => {
      // DEBUG: Log the providerId and its type
      console.log('🔥 FIXED ProviderPerformanceView - providerId:', providerId, 'type:', typeof providerId);
      
      // FIXED: Use UUID string directly instead of converting to integer
      // OLD BROKEN CODE: const providerIdNum = parseInt(providerId, 10);
      
      // Get provider details using UUID string
      const { data: provider, error: providerError } = await supabase
        .from('authorized_providers')
        .select(`
          id,
          name,
          performance_rating,
          compliance_score
        `)
        .eq('id', providerId) // Use UUID string directly
        .single();

      if (providerError) {
        console.error('Provider query error:', providerError);
        throw providerError;
      }

      // Get teams for this provider
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          performance_score
        `)
        .eq('provider_id', providerId);

      if (teamsError) throw teamsError;

      // Get team member counts
      const teamIds = teams?.map(t => t.id) || [];
      const { data: memberCounts, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .in('team_id', teamIds)
        .eq('status', 'active');

      if (memberError) throw memberError;

      // Get certificate counts for teams' locations
      const { data: teamLocations, error: locationError } = await supabase
        .from('teams')
        .select('id, location_id')
        .in('id', teamIds);

      if (locationError) throw locationError;

      const locationIds = teamLocations?.map(t => t.location_id).filter(Boolean) || [];
      const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('location_id')
        .in('location_id', locationIds)
        .eq('status', 'ACTIVE');

      if (certError) throw certError;

      // Get course counts
      const { data: courses, error: courseError } = await supabase
        .from('course_offerings')
        .select('location_id')
        .in('location_id', locationIds)
        .eq('status', 'SCHEDULED');

      if (courseError) throw courseError;

      // Process the data
      const memberCountByTeam = memberCounts?.reduce((acc, member) => {
        acc[member.team_id] = (acc[member.team_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const certCountByLocation = certificates?.reduce((acc, cert) => {
        if (cert.location_id) {
          acc[cert.location_id] = (acc[cert.location_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const courseCountByLocation = courses?.reduce((acc, course) => {
        if (course.location_id) {
          acc[course.location_id] = (acc[course.location_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const locationByTeam = teamLocations?.reduce((acc, team) => {
        if (team.location_id) {
          acc[team.id] = team.location_id;
        }
        return acc;
      }, {} as Record<string, string>) || {};

      return {
        provider,
        totalCertificates: certificates?.length || 0,
        totalCourses: courses?.length || 0,
        teams: teams?.map(team => ({
          ...team,
          memberCount: memberCountByTeam[team.id] || 0,
          certificateCount: certCountByLocation[locationByTeam[team.id]] || 0
        })) || []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!providerData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No performance data available</p>
      </div>
    );
  }

  const { provider, totalCertificates, totalCourses, teams } = providerData;
  const totalMembers = teams.reduce((sum: number, team: any) => sum + team.memberCount, 0);
  const avgTeamPerformance = teams.length > 0
    ? Math.round(teams.reduce((sum: number, team: any) => sum + (team.performance_score || 0), 0) / teams.length)
    : 0;

  const teamPerformanceData = teams.map((team: any) => ({
    name: team.name.length > 15 ? team.name.substring(0, 15) + '...' : team.name,
    score: team.performance_score || 0,
    members: team.memberCount || 0,
    certificates: team.certificateCount || 0
  }));

  return (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Rating</p>
                <p className="text-2xl font-bold">{provider.performance_rating.toFixed(1)}/5.0</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={(provider.performance_rating / 5) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{provider.compliance_score.toFixed(1)}%</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={provider.compliance_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Teams</p>
                <p className="text-2xl font-bold">{teams.length}</p>
                <p className="text-xs text-muted-foreground">{totalMembers} members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold">{totalCertificates}</p>
                <p className="text-xs text-muted-foreground">{totalCourses} courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Details */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teams.map((team: any) => (
              <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {team.memberCount} members • {team.certificateCount} certificates
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold">{team.performance_score || 0}%</div>
                    <div className="text-sm text-muted-foreground">Performance</div>
                  </div>
                  <Badge variant={
                    (team.performance_score || 0) >= 90 ? 'default' : 
                    (team.performance_score || 0) >= 70 ? 'secondary' : 'destructive'
                  }>
                    {(team.performance_score || 0) >= 90 ? 'Excellent' : 
                     (team.performance_score || 0) >= 70 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
            ))}

            {teams.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No teams found for this provider</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
