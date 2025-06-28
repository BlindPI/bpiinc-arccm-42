import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Award, Clock } from 'lucide-react';

export interface InstructorDashboardProps {
  config?: {
    showSchedule?: boolean;
    showStudents?: boolean;
  };
  profile?: {
    id: string;
    role: string;
    display_name?: string;
  };
  teamContext?: {
    teamId: string;
    teamName: string;
    locationName: string;
    locationCity?: string;
    locationState?: string;
    locationAddress?: string;
    apUserName?: string;
    apUserEmail?: string;
    apUserPhone?: string;
  };
}

export function InstructorDashboard({ config, profile, teamContext }: InstructorDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.display_name || 'Instructor'}
          </p>
        </div>
        {teamContext && (
          <Badge variant="outline">
            {teamContext.teamName}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 more this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Taught</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {config?.showSchedule !== false && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">CPR/AED Training</h4>
                  <p className="text-sm text-muted-foreground">9:00 AM - 12:00 PM</p>
                  <p className="text-xs text-muted-foreground">Room A - 12 students</p>
                </div>
                <Badge variant="default">In Progress</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">First Aid Certification</h4>
                  <p className="text-sm text-muted-foreground">1:00 PM - 5:00 PM</p>
                  <p className="text-xs text-muted-foreground">Room B - 8 students</p>
                </div>
                <Badge variant="secondary">Upcoming</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Instructor Recertification</h4>
                  <p className="text-sm text-muted-foreground">6:00 PM - 8:00 PM</p>
                  <p className="text-xs text-muted-foreground">Room C - 4 instructors</p>
                </div>
                <Badge variant="outline">Scheduled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {config?.showStudents !== false && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">CPR/AED - Completed</p>
                </div>
                <Badge variant="success">Certified</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mike Chen</p>
                  <p className="text-sm text-muted-foreground">First Aid - In Progress</p>
                </div>
                <Badge variant="warning">Training</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Emily Davis</p>
                  <p className="text-sm text-muted-foreground">Instructor Level - Pending</p>
                </div>
                <Badge variant="secondary">Review</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default InstructorDashboard;
