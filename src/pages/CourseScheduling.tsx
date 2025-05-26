
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Calendar, Clock, AlertTriangle, Zap, Users, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CourseScheduler } from '@/components/courses/CourseScheduler';
import { ScheduleCalendarView } from '@/components/scheduling/ScheduleCalendarView';
import { ConflictDetector } from '@/components/scheduling/ConflictDetector';
import { SchedulingRecommendations } from '@/components/scheduling/SchedulingRecommendations';
import { ResourceAvailability } from '@/components/scheduling/ResourceAvailability';
import { useProfile } from '@/hooks/useProfile';
import { useCourseScheduling } from '@/hooks/useCourseScheduling';

export default function CourseScheduling() {
  const { data: profile } = useProfile();
  const { getCourseSchedules } = useCourseScheduling();
  const { data: schedules, isLoading } = getCourseSchedules();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showScheduler, setShowScheduler] = useState(false);

  const canSchedule = profile?.role && ['SA', 'AD', 'AP'].includes(profile.role);

  if (!canSchedule) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Calendar className="h-7 w-7 text-primary" />}
          title="Course Scheduling"
          subtitle="Access denied - insufficient permissions"
        />
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Only System Administrators, Administrators, and Authorized Providers can access course scheduling.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-lg">Loading course schedules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Calendar className="h-7 w-7 text-primary" />}
        title="Course Scheduling"
        subtitle="Advanced scheduling with conflict detection and recommendations"
        actions={
          <Button onClick={() => setShowScheduler(true)} className="gap-2">
            <Clock className="h-4 w-4" />
            New Schedule
          </Button>
        }
      />

      {showScheduler && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Course Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseScheduler 
              onScheduleCreated={() => setShowScheduler(false)}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowScheduler(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Conflicts
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <ScheduleCalendarView 
            schedules={schedules || []}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onScheduleClick={(schedule) => console.log('Schedule clicked:', schedule)}
          />
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <ConflictDetector schedules={schedules || []} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <SchedulingRecommendations 
            schedules={schedules || []}
            selectedDate={selectedDate}
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourceAvailability 
            schedules={schedules || []}
            selectedDate={selectedDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
