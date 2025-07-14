import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarSchedulingView } from '@/components/scheduling/CalendarSchedulingView';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle,
  Loader2,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Scheduling() {
  const { user } = useAuth();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simplified metrics - only essential data
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['scheduling-metrics'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's bookings
      const { data: todayBookings } = await supabase
        .from('availability_bookings')
        .select('*')
        .eq('booking_date', today)
        .eq('status', 'scheduled');

      // Get upcoming bookings (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { data: upcomingBookings } = await supabase
        .from('availability_bookings')
        .select('*')
        .gte('booking_date', today)
        .lte('booking_date', nextWeek.toISOString().split('T')[0])
        .eq('status', 'scheduled');

      // Get active instructors
      const { data: instructors } = await supabase
        .from('profiles')
        .select('id, display_name, user_availability!inner(*)')
        .in('role', ['IC', 'IP', 'IT']);

      return {
        todayBookings: todayBookings?.length || 0,
        upcomingBookings: upcomingBookings?.length || 0,
        activeInstructors: instructors?.length || 0,
        availableSlots: instructors?.reduce((total, instructor) => 
          total + (instructor.user_availability?.length || 0), 0) || 0
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
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Instructor Scheduling
          </h1>
          <p className="text-muted-foreground mt-1">
            View instructor availability and schedule training sessions
          </p>
        </div>
        
        {/* Essential Metrics */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{metrics?.todayBookings || 0}</div>
            <div className="text-sm text-muted-foreground">Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics?.upcomingBookings || 0}</div>
            <div className="text-sm text-muted-foreground">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics?.activeInstructors || 0}</div>
            <div className="text-sm text-muted-foreground">Instructors</div>
          </div>
        </div>
      </div>

      {/* Main Calendar - Prominent Display */}
      <div className="bg-card rounded-lg border shadow-sm">
        <CalendarSchedulingView />
      </div>

      {/* Advanced Features - Collapsible */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced Scheduling Features
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Bulk Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedule multiple sessions at once
                </p>
                <Button variant="outline" size="sm">
                  Open Bulk Scheduler
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Conflict Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Automatically detect scheduling conflicts
                </p>
                <Button variant="outline" size="sm">
                  View Conflicts
                </Button>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}