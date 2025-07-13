import React, { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamAvailability, useTeamPermission } from '@/hooks/team/useTeamManagement';
import { useProfile } from '@/hooks/useProfile';
import { ChevronLeft, ChevronRight, Users, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeamAvailabilityDashboardProps {
  teamId: string;
}

export function TeamAvailabilityDashboard({ teamId }: TeamAvailabilityDashboardProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { data: profile } = useProfile();
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const {
    data: teamAvailability,
    isLoading,
    error
  } = useTeamAvailability(
    teamId,
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );

  const {
    data: permission
  } = useTeamPermission(teamId, profile?.id || '');

  const weekSummary = useMemo(() => {
    if (!teamAvailability) return null;

    const totalMembers = teamAvailability.length;
    const totalAvailableHours = teamAvailability.reduce((sum, member) => sum + member.availableHours, 0);
    const totalScheduledHours = teamAvailability.reduce((sum, member) => sum + member.scheduledHours, 0);
    const utilizationRate = totalAvailableHours > 0 ? (totalScheduledHours / totalAvailableHours) * 100 : 0;

    return {
      totalMembers,
      totalAvailableHours: Math.round(totalAvailableHours),
      totalScheduledHours: Math.round(totalScheduledHours),
      utilizationRate: Math.round(utilizationRate)
    };
  }, [teamAvailability]);

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const getSlotForMemberAndTime = (member: any, day: Date, time: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return member.availabilitySlots.find((slot: any) => 
      slot.date === dayStr && 
      slot.startTime <= time && 
      slot.endTime > time
    );
  };

  const getSlotColor = (bookingType: string) => {
    const colors = {
      available: 'bg-green-100 border-green-300 text-green-800',
      training: 'bg-blue-100 border-blue-300 text-blue-800',
      course: 'bg-purple-100 border-purple-300 text-purple-800',
      meeting: 'bg-orange-100 border-orange-300 text-orange-800',
      break: 'bg-gray-100 border-gray-300 text-gray-600',
      unavailable: 'bg-red-100 border-red-300 text-red-800'
    };
    return colors[bookingType as keyof typeof colors] || colors.unavailable;
  };

  if (!permission?.hasPermission) {
    return (
      <Alert>
        <AlertDescription>
          You don't have permission to view team availability. Contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load team availability. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Summary */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {weekSummary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="text-lg font-semibold">{weekSummary.totalMembers}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-lg font-semibold">{weekSummary.totalAvailableHours}h</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-lg font-semibold">{weekSummary.totalScheduledHours}h</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Utilization</p>
                  <p className="text-lg font-semibold">{weekSummary.utilizationRate}%</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Team Availability Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Team Availability Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="font-medium text-sm p-2">Member</div>
                {weekDays.map(day => (
                  <div key={day.toISOString()} className="font-medium text-sm p-2 text-center">
                    <div>{format(day, 'EEE')}</div>
                    <div className="text-xs text-muted-foreground">{format(day, 'M/d')}</div>
                  </div>
                ))}
              </div>

              {/* Member Rows */}
              {teamAvailability?.map(member => (
                <div key={member.userId} className="border-t">
                  <div className="grid grid-cols-8 gap-1">
                    {/* Member Info */}
                    <div className="p-3 flex flex-col">
                      <span className="font-medium text-sm">{member.userName}</span>
                      <span className="text-xs text-muted-foreground">{member.userRole}</span>
                      <div className="mt-1 space-y-1">
                        <div className="text-xs">
                          <span className="text-green-600">{Math.round(member.availableHours)}h available</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-blue-600">{Math.round(member.scheduledHours)}h scheduled</span>
                        </div>
                      </div>
                    </div>

                    {/* Daily Availability */}
                    {weekDays.map(day => (
                      <div key={`${member.userId}-${day.toISOString()}`} className="p-1">
                        <div className="space-y-1">
                          {getTimeSlots().map(time => {
                            const slot = getSlotForMemberAndTime(member, day, time);
                            if (!slot) return null;

                            return (
                              <div
                                key={`${member.userId}-${day.toISOString()}-${time}`}
                                className={`text-xs p-1 rounded border ${getSlotColor(slot.bookingType)}`}
                                title={`${slot.title} (${slot.startTime}-${slot.endTime})`}
                              >
                                <div className="truncate">{slot.title}</div>
                                <div className="text-[10px] opacity-75">
                                  {slot.startTime}-{slot.endTime}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                    <span>Training</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
                    <span>Course</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                    <span>Meeting</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}