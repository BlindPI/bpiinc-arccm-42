import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock, Plus, Settings } from 'lucide-react';
import { WeeklyAvailabilityGrid } from './WeeklyAvailabilityGrid';
import { AvailabilityExceptions } from './AvailabilityExceptions';
import { AvailabilityBookings } from './AvailabilityBookings';
import { AvailabilitySettings } from './AvailabilitySettings';
import { ConflictDetectionPanel } from './ConflictDetectionPanel';
import { InstructorSchedulingPanel } from './InstructorSchedulingPanel';
import { useUserAvailability } from '@/hooks/useUserAvailability';

export function AvailabilityManager() {
  const [activeTab, setActiveTab] = useState('schedule');
  const { availability, exceptions, bookings, isLoading } = useUserAvailability();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability Management</h1>
          <p className="text-muted-foreground">
            Manage your schedule, exceptions, bookings, and course scheduling
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="gap-2">
            <Clock className="h-4 w-4" />
            Exceptions
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="gap-2">
            <Clock className="h-4 w-4" />
            Conflict Check
          </TabsTrigger>
          <TabsTrigger value="course-scheduling" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Course Scheduling
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>
                Set your regular weekly availability. You can specify different time slots for each day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyAvailabilityGrid 
                availability={availability}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Availability Exceptions</CardTitle>
              <CardDescription>
                Manage one-time changes to your regular schedule for specific dates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityExceptions exceptions={exceptions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>
                View your scheduled training sessions and committed time slots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityBookings bookings={bookings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-6">
          <ConflictDetectionPanel />
        </TabsContent>

        <TabsContent value="course-scheduling" className="space-y-6">
          <InstructorSchedulingPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
              <CardDescription>
                Configure your default preferences and time slot settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilitySettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}