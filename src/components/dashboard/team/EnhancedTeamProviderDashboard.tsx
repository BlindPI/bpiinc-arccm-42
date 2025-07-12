import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, GraduationCap, TrendingUp, Calendar, Award, AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TeamProviderDashboardProps {
  teamId?: string;
}

interface SimpleTeam {
  id: string;
  team_id: string;
  name: string;
  status: string;
  location_id: string;
}

interface SimpleCourse {
  id: string;
  course_name: string;
  start_date: string;
  status: string;
  current_enrollment: number;
}

interface SimpleCertificate {
  id: string;
  recipient_name: string;
  course_name: string;
  issue_date: string;
  status: string;
}

export function EnhancedTeamProviderDashboard({ teamId }: TeamProviderDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Get primary team with simple typing
  const { data: primaryTeam } = useQuery({
    queryKey: ['primary-team', user?.id],
    queryFn: async (): Promise<SimpleTeam | null> => {
      if (!user?.id) return null;
      
      const teamMembersResponse = await supabase
        .from('team_members')
        .select('team_id, teams!inner(id, name, status, location_id)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);
        
      const { data: teamMembers } = teamMembersResponse;

      if (teamMembers && teamMembers.length > 0) {
        const member = teamMembers[0];
        const team = member.teams as any;
        return {
          id: team.id,
          team_id: member.team_id,
          name: team.name,
          status: team.status,
          location_id: team.location_id
        };
      }
      return null;
    },
    enabled: !!user?.id
  });

  // Get courses with simple typing
  const { data: coursesData = [] } = useQuery({
    queryKey: ['team-courses', primaryTeam?.team_id],
    queryFn: async (): Promise<SimpleCourse[]> => {
      if (!primaryTeam?.team_id) return [];

      // Use explicit type casting to avoid depth issues
      const courseResponse = await (supabase as any)
        .from('course_schedules')
        .select('id, start_date, status, current_enrollment, course_id')
        .eq('team_id', primaryTeam.team_id)
        .order('start_date', { ascending: false })
        .limit(5);
        
      const { data } = courseResponse;

      if (!data) return [];

      // Get course names
      const courseIds = data.map(c => c.course_id).filter(Boolean);
      let courseNames: Record<string, string> = {};
      
      if (courseIds.length > 0) {
        // Skip course name lookup to avoid table mismatch
        courseNames = courseIds.reduce((acc, id) => {
          acc[id] = `Course ${id.substring(0, 8)}`;
          return acc;
        }, {} as Record<string, string>);
      }

      return data.map(course => ({
        id: course.id,
        course_name: courseNames[course.course_id] || 'Unknown Course',
        start_date: course.start_date,
        status: course.status,
        current_enrollment: course.current_enrollment || 0
      }));
    },
    enabled: !!primaryTeam?.team_id
  });

  // Get certificates with simple typing
  const { data: certificatesData = [] } = useQuery({
    queryKey: ['team-certificates', primaryTeam?.location_id],
    queryFn: async (): Promise<SimpleCertificate[]> => {
      if (!primaryTeam?.location_id) return [];

      const certResponse = await supabase
        .from('certificates')
        .select('id, recipient_name, course_name, issue_date, status')
        .eq('location_id', primaryTeam.location_id)
        .order('issue_date', { ascending: false })
        .limit(5);
        
      const { data } = certResponse;

      return data?.map(cert => ({
        id: cert.id,
        recipient_name: cert.recipient_name,
        course_name: cert.course_name,
        issue_date: cert.issue_date,
        status: cert.status
      })) || [];
    },
    enabled: !!primaryTeam?.location_id
  });

  // Memoized analytics data
  const analyticsData = useMemo(() => ({
    totalCourses: coursesData.length,
    activeCourses: coursesData.filter(c => c.status === 'active').length,
    totalCertificates: certificatesData.length,
    recentCertificates: certificatesData.filter(c => 
      new Date(c.issue_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    completionRate: coursesData.length > 0 
      ? Math.round((coursesData.filter(c => c.status === 'completed').length / coursesData.length) * 100)
      : 0
  }), [coursesData, certificatesData]);

  if (!primaryTeam) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No team assigned or team data not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
          <p className="text-muted-foreground">
            {primaryTeam.name} - Enhanced Provider View
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <MapPin className="h-3 w-3 mr-1" />
          Team ID: {primaryTeam.team_id}
        </Badge>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.activeCourses} active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalCertificates}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.recentCertificates} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Course completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{primaryTeam.status}</div>
            <p className="text-xs text-muted-foreground">
              Current team status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coursesData.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{course.course_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(course.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                    </div>
                  ))}
                  {coursesData.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No recent courses</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Certificates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {certificatesData.slice(0, 3).map((certificate) => (
                    <div key={certificate.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{certificate.recipient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {certificate.course_name}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(certificate.issue_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                  {certificatesData.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No recent certificates</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coursesData.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{course.course_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Start Date: {new Date(course.start_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Enrollment: {course.current_enrollment} students
                      </p>
                    </div>
                    <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                      {course.status}
                    </Badge>
                  </div>
                ))}
                {coursesData.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No courses available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {certificatesData.map((certificate) => (
                  <div key={certificate.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{certificate.recipient_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Course: {certificate.course_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Issued: {new Date(certificate.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {certificate.status}
                    </Badge>
                  </div>
                ))}
                {certificatesData.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No certificates available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}