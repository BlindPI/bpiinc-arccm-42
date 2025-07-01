
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Calendar, Users, Clock, MapPin } from 'lucide-react';
import { useTeamContext } from '@/hooks/useTeamContext';
import { useTeamMetrics, useTeamCourses } from '@/hooks/team/useTeamScopedData';
import { InlineLoader } from '@/components/ui/LoadingStates';

export function TeamInstructorDashboard() {
  const { primaryTeam, teamLocation, teamRole } = useTeamContext();
  const { data: metrics, isLoading: metricsLoading } = useTeamMetrics();
  const { data: courses, isLoading: coursesLoading } = useTeamCourses();

  if (metricsLoading) {
    return <InlineLoader message="Loading team dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-gradient-to-r from-teal-50 to-white border-teal-200 shadow-sm">
        <GraduationCap className="h-4 w-4 text-teal-600 mr-2" />
        <AlertDescription className="text-teal-800 font-medium">
          Team Instructor Dashboard - {primaryTeam?.teams?.name || 'Your Team'}
          {teamLocation?.name && (
            <span className="ml-2 text-teal-600">
              <MapPin className="h-3 w-3 inline mr-1" />
              {teamLocation.name}
            </span>
          )}
          <span className="ml-2 text-xs bg-teal-100 px-2 py-1 rounded">
            {teamRole}
          </span>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-teal-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.activeCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Assigned courses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Team Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.teamSize || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Team members</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.totalCertificates || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Team certificates</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics?.teamPerformance || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">Team score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">My Scheduled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="text-center py-4">Loading courses...</div>
            ) : courses?.length > 0 ? (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-teal-900">{course.courses?.name}</h4>
                      <p className="text-sm text-teal-600">
                        {new Date(course.start_date).toLocaleDateString()} - {new Date(course.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        course.status === 'SCHEDULED' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {course.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Max: {course.max_participants}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No courses assigned</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-teal-50 hover:bg-teal-100 rounded-lg flex flex-col items-center justify-center transition-colors">
                <Calendar className="h-6 w-6 text-teal-600 mb-2" />
                <span className="text-sm font-medium text-teal-800">My Schedule</span>
              </button>
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors">
                <Users className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-800">Team Roster</span>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col items-center justify-center transition-colors">
                <GraduationCap className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-800">Issue Certificate</span>
              </button>
              <button className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg flex flex-col items-center justify-center transition-colors">
                <Clock className="h-6 w-6 text-amber-600 mb-2" />
                <span className="text-sm font-medium text-amber-800">Log Hours</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
