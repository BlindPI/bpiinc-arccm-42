import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BulkSchedulingPanel } from '@/components/team/BulkSchedulingPanel';
import { ScheduleCalendarView } from '@/components/scheduling/ScheduleCalendarView';
import { ConflictDetector } from '@/components/scheduling/ConflictDetector';
import { ResourceAvailability } from '@/components/scheduling/ResourceAvailability';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  Loader2
} from 'lucide-react';

export default function Scheduling() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch scheduling metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['scheduling-metrics'],
    queryFn: async () => {
      // Get upcoming bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('availability_bookings')
        .select('*')
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .eq('status', 'scheduled');

      if (bookingsError) throw bookingsError;

      // Get active locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'ACTIVE');

      if (locationsError) throw locationsError;

      // Get conflicts
      const { data: conflicts, error: conflictsError } = await supabase
        .from('assignment_conflicts')
        .select('*')
        .is('resolved_at', null);

      if (conflictsError) throw conflictsError;

      // Get bulk operations
      const { data: bulkOps, error: bulkError } = await supabase
        .from('bulk_operation_queue')
        .select('*')
        .in('status', ['pending', 'processing']);

      if (bulkError) throw bulkError;

      return {
        upcomingBookings: bookings?.length || 0,
        activeLocations: locations?.length || 0,
        conflicts: conflicts?.length || 0,
        activeBulkOps: bulkOps?.length || 0,
        todayBookings: bookings?.filter(b => 
          b.booking_date === new Date().toISOString().split('T')[0]
        ).length || 0
      };
    },
    enabled: !!user,
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Scheduling & Availability
        </h1>
        <p className="text-muted-foreground">
          Manage team schedules, bookings, and resource availability
        </p>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Today's Bookings</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics?.todayBookings || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Upcoming</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics?.upcomingBookings || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Locations</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics?.activeLocations || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Conflicts</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics?.conflicts || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">Bulk Ops</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics?.activeBulkOps || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleCalendarView 
              schedules={[]}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onScheduleClick={() => {}}
            />
          </CardContent>
        </Card>

        {/* Resource Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resource Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceAvailability 
              schedules={[]}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>
      </div>

      {/* Conflict Detection */}
      {metrics?.conflicts && metrics.conflicts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Scheduling Conflicts
              <Badge variant="destructive">{metrics.conflicts}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConflictDetector schedules={[]} />
          </CardContent>
        </Card>
      )}

      {/* Bulk Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Bulk Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BulkSchedulingPanel 
            teamId="default-team"
            teamMembers={[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}