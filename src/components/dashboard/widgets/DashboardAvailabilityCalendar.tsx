import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, Calendar, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvailabilitySlot, WeeklySchedule, DAYS_OF_WEEK, AVAILABILITY_TYPES } from '@/types/availability';
import { DashboardAvailabilityService, AvailabilityUser } from '@/services/dashboard/availabilityService';

interface DashboardAvailabilityCalendarProps {
  userRole: string;
  userId: string;
  teamIds?: string[];
  className?: string;
}

export const DashboardAvailabilityCalendar: React.FC<DashboardAvailabilityCalendarProps> = ({
  userRole,
  userId,
  teamIds = [],
  className
}) => {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'own' | 'team' | 'all'>('own');
  const [selectedUser, setSelectedUser] = useState<AvailabilityUser | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [userTeamIds, setUserTeamIds] = useState<string[]>([]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAvailabilityTypeInfo = (type: string) => {
    return AVAILABILITY_TYPES.find(t => t.value === type) || AVAILABILITY_TYPES[0];
  };

  const getAvailabilityColors = (type: string) => {
    switch (type) {
      case 'available':
        return {
          bg: 'bg-green-50',
          border: 'border-green-300',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-700 border-green-300'
        };
      case 'busy':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300', 
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-700 border-red-300'
        };
      case 'out_of_office':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-700 border-gray-300'
        };
      case 'tentative':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-700 border-yellow-300'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-700 border-blue-300'
        };
    }
  };

  const canViewTeamAvailability = () => {
    return DashboardAvailabilityService.canViewTeamAvailability(userRole);
  };

  const canViewAllAvailability = () => {
    return DashboardAvailabilityService.canViewAllAvailability(userRole);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const getWeekRange = () => {
    const start = new Date(currentWeek);
    start.setDate(currentWeek.getDate() - currentWeek.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return {
      start: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  };

  // Load user's team IDs on mount
  useEffect(() => {
    const loadUserTeamIds = async () => {
      const teamIds = await DashboardAvailabilityService.getUserTeamIds(userId);
      setUserTeamIds(teamIds);
    };
    
    loadUserTeamIds();
  }, [userId]);

  const loadAvailabilityData = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: AvailabilityUser[] = [];

      if (viewMode === 'all' && canViewAllAvailability()) {
        data = await DashboardAvailabilityService.getAllUsersAvailability();
      } else if (viewMode === 'team' && canViewTeamAvailability()) {
        const teamsToQuery = teamIds.length > 0 ? teamIds : userTeamIds;
        data = await DashboardAvailabilityService.getTeamAvailability(teamsToQuery);
      } else {
        // Default to own availability
        const ownData = await DashboardAvailabilityService.getOwnAvailability(userId);
        data = [ownData];
      }

      setAvailabilityData(data);
      // Set the first user as selected for display
      if (data.length > 0) {
        setSelectedUser(data[0]);
      }
    } catch (error: any) {
      console.error('Failed to load availability data:', error);
      setError(error.message || 'Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && (userTeamIds.length > 0 || viewMode === 'own' || viewMode === 'all')) {
      loadAvailabilityData();
    }
  }, [viewMode, userId, userTeamIds, teamIds]);

  const organizeAvailabilityByWeek = (slots: UserAvailabilitySlot[]): WeeklySchedule => {
    const weeklySchedule: WeeklySchedule = {};
    
    DAYS_OF_WEEK.forEach(day => {
      weeklySchedule[day.value.toString()] = [];
    });

    slots.forEach(slot => {
      const daySlots = weeklySchedule[slot.day_of_week.toString()];
      if (daySlots) {
        daySlots.push(slot);
      }
    });

    // Sort slots within each day by start time
    Object.keys(weeklySchedule).forEach(day => {
      weeklySchedule[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return weeklySchedule;
  };

  const weekRange = getWeekRange();
  const weeklySchedule = selectedUser ? organizeAvailabilityByWeek(selectedUser.availability_slots) : {};

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-4 text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability Schedule
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {/* User Selector for team/all view */}
            {availabilityData.length > 1 && (
              <Select 
                value={selectedUser?.user_id || ''} 
                onValueChange={(userId) => {
                  const user = availabilityData.find(u => u.user_id === userId);
                  setSelectedUser(user || null);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {availabilityData.map(user => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* View Mode Selector */}
            {(canViewTeamAvailability() || canViewAllAvailability()) && (
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own">My Schedule</SelectItem>
                  {canViewTeamAvailability() && (
                    <SelectItem value="team">Team</SelectItem>
                  )}
                  {canViewAllAvailability() && (
                    <SelectItem value="all">All Users</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-lg font-semibold min-w-64 text-center">
              Weekly Schedule ({weekRange.start} - {weekRange.end})
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
          >
            Today
          </Button>
        </div>

        {/* Selected User Info */}
        {selectedUser && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{selectedUser.display_name}</div>
                <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
              </div>
              {selectedUser.team_role && (
                <Badge variant="outline">{selectedUser.team_role}</Badge>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {!selectedUser ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div>No availability data found</div>
            <div className="text-xs mt-1">
              {viewMode === 'own' ? 'Set your availability in your profile' : 'No team availability set'}
            </div>
          </div>
        ) : (
          <>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.value} className="p-3 text-center font-medium text-muted-foreground border rounded-md bg-gray-50">
                  <div className="font-semibold">{day.short}</div>
                  <div className="text-xs">{day.label}</div>
                </div>
              ))}
            </div>

            {/* Availability Grid */}
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map(day => {
                const daySlots = weeklySchedule[day.value.toString()] || [];
                
                return (
                  <div
                    key={day.value}
                    className="min-h-48 p-2 border rounded-md bg-background hover:bg-muted/50 transition-colors"
                  >
                    {/* Day slots */}
                    <div className="space-y-2">
                      {daySlots.length > 0 ? (
                        daySlots.map(slot => {
                          const colors = getAvailabilityColors(slot.availability_type);
                          const typeInfo = getAvailabilityTypeInfo(slot.availability_type);
                          
                          return (
                            <div
                              key={slot.id}
                              className={cn(
                                'p-2 rounded-md border transition-all duration-200',
                                colors.bg,
                                colors.border
                              )}
                            >
                              <div className="space-y-1">
                                {/* Time range */}
                                <div className={cn('text-xs font-medium', colors.text)}>
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </div>
                                
                                {/* Availability type badge */}
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-xs', colors.badge)}
                                >
                                  {typeInfo.label}
                                </Badge>
                                
                                {/* Notes */}
                                {slot.notes && (
                                  <div className={cn('text-xs mt-1', colors.text)}>
                                    {slot.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center h-full min-h-32">
                          <div className="text-xs text-muted-foreground text-center">
                            <Clock className="h-4 w-4 mx-auto mb-1 opacity-50" />
                            <div>No availability</div>
                            <div>set for this day</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-muted/50 rounded-md">
              <div className="flex items-center gap-6 text-sm">
                <span className="font-medium text-muted-foreground">Legend:</span>
                {AVAILABILITY_TYPES.map(type => {
                  const colors = getAvailabilityColors(type.value);
                  return (
                    <div key={type.value} className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-sm border', colors.bg, colors.border)} />
                      <span className="text-muted-foreground">{type.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Weekly Summary</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  {AVAILABILITY_TYPES.map(type => {
                    const count = selectedUser.availability_slots.filter(slot => 
                      slot.availability_type === type.value
                    ).length;
                    return (
                      <div key={type.value} className="flex justify-between">
                        <span>{type.label}:</span>
                        <span className="font-medium">{count} slots</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};