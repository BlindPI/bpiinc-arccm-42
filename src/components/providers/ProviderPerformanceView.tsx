
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Award, Target, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProviderPerformanceViewProps {
  providerId: string;
}

export function ProviderPerformanceView({ providerId }: ProviderPerformanceViewProps) {
  const { data: providerData, isLoading } = useQuery({
    queryKey: ['provider-performance', providerId],
    queryFn: async () => {
      // Get provider details with team and performance data
      const { data: provider, error: providerError } = await supabase
        .from('authorized_providers')
        .select(`
          id,
          name,
          performance_rating,
          compliance_score,
          teams(
            id,
            name,
            performance_score,
            team_members(count),
            certificates(count)
          )
        `)
        .eq('id', providerId)
        .single();

      if (providerError) throw providerError;

      // Get certificate count for provider
      const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('id')
        .in('roster_id', provider.teams?.map(t => t.id) || []);

      if (certError) throw certError;

      // Get course offerings count
      const { data: courses, error: courseError } = await supabase
        .from('course_offerings')
        .select('id')
        .in('instructor_id', provider.teams?.flatMap(t => t.team_members?.map(m => m.user_id)) || []);

      if (courseError) throw courseError;

      return {
        provider,
        totalCertificates: certificates.length,
        totalCourses: courses.length,
        teams: provider.teams || []
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
  const totalMembers = teams.reduce((sum, team) => sum + (team.team_members?.[0]?.count || 0), 0);
  const avgTeamPerformance = teams.length > 0 
    ? Math.round(teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teams.length)
    : 0;

  const teamPerformanceData = teams.map(team => ({
    name: team.name.length > 15 ? team.name.substring(0, 15) + '...' : team.name,
    score: team.performance_score || 0,
    members: team.team_members?.[0]?.count || 0,
    certificates: team.certificates?.[0]?.count || 0
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
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {team.team_members?.[0]?.count || 0} members • {team.certificates?.[0]?.count || 0} certificates
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
