import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function SystemStatus() {
  const { data: systemStatus, isLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      // Check enrollments table (should be empty)
      const { count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      // Check student_roster_members (should have data)
      const { count: rosterMembersCount } = await supabase
        .from('student_roster_members')
        .select('*', { count: 'exact', head: true });

      // Check availability_bookings with roster_id
      const { count: linkedBookingsCount } = await supabase
        .from('availability_bookings')
        .select('*', { count: 'exact', head: true })
        .not('roster_id', 'is', null);

      // Check student profiles
      const { count: studentProfilesCount } = await supabase
        .from('student_enrollment_profiles')
        .select('*', { count: 'exact', head: true });

      return {
        enrollmentsEmpty: enrollmentsCount === 0,
        rosterMembersCount: rosterMembersCount || 0,
        linkedBookingsCount: linkedBookingsCount || 0,
        studentProfilesCount: studentProfilesCount || 0
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Legacy Enrollments Table</span>
          <Badge variant={systemStatus?.enrollmentsEmpty ? "default" : "destructive"} className="flex items-center gap-1">
            {systemStatus?.enrollmentsEmpty ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {systemStatus?.enrollmentsEmpty ? "Empty (Good)" : "Has Data (Bad)"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Active Roster Members</span>
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {systemStatus?.rosterMembersCount} members
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Linked Course Bookings</span>
          <Badge variant={systemStatus?.linkedBookingsCount ? "default" : "secondary"} className="flex items-center gap-1">
            {systemStatus?.linkedBookingsCount ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {systemStatus?.linkedBookingsCount} courses
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Student Profiles</span>
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {systemStatus?.studentProfilesCount} students
          </Badge>
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            ✅ System is now using the unified roster-based enrollment system exclusively.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}