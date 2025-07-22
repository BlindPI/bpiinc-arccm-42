import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, Calendar, ChevronDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvailabilitySlot, WeeklySchedule, DAYS_OF_WEEK, AVAILABILITY_TYPES } from '@/types/availability';
import { DashboardAvailabilityService, AvailabilityUser } from '@/services/dashboard/availabilityService';

interface AvailabilityWidgetProps {
  userRole: string;
  userId: string;
  teamIds?: string[];
  className?: string;
}

export const AvailabilityWidget: React.FC<AvailabilityWidgetProps> = ({
  userRole,
  userId,
  teamIds = [],
  className
}) => {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AvailabilityUser | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'own' | 'team' | 'all'>('own');
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
        return 'bg-green-100 text-green-700 border-green-300';
      case 'busy':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'out_of_office':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const canViewTeamAvailability = () => {
    return DashboardAvailabilityService.canViewTeamAvailability(userRole);
  };

  const canViewAllAvailability = () => {
    return DashboardAvailabilityService.canViewAllAvailability(userRole);
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

  const handleUserClick = (user: AvailabilityUser) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const getAvailabilitySummary = (user: AvailabilityUser) => {
    const summary = AVAILABILITY_TYPES.reduce((acc, type) => {
      acc[type.value] = user.availability_slots.filter(slot => slot.availability_type === type.value).length;
      return acc;
    }, {} as Record<string, number>);

    return summary;
  };

  const getStatusBadgeForUser = (user: AvailabilityUser) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todaySlots = user.availability_slots.filter(slot => 
      slot.day_of_week === currentDay && 
      slot.start_time <= currentTime && 
      slot.end_time >= currentTime
    );

    if (todaySlots.length === 0) {
      return <Badge variant="outline" className="text-xs">Unavailable</Badge>;
    }

    const currentSlot = todaySlots[0];
    const typeInfo = getAvailabilityTypeInfo(currentSlot.availability_type);
    const colors = getAvailabilityColors(currentSlot.availability_type);

    return (
      <Badge variant="outline" className={cn('text-xs', colors)}>
        {typeInfo.label}
      </Badge>
    );
  };

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

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Team Availability
            </CardTitle>
            
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
        </CardHeader>
        
        <CardContent>
          {error ? (
            <div className="text-center py-4 text-red-600">
              {error}
            </div>
          ) : availabilityData.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div>No availability data found</div>
              <div className="text-xs mt-1">
                {viewMode === 'own' ? 'Set your availability in your profile' : 'No team availability set'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {availabilityData.slice(0, 5).map(user => {
                const summary = getAvailabilitySummary(user);
                const totalSlots = Object.values(summary).reduce((a, b) => a + b, 0);
                
                return (
                  <div
                    key={user.user_id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{user.display_name}</div>
                          {getStatusBadgeForUser(user)}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.team_role && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {user.team_role}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{totalSlots} slots</div>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View Details <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {availabilityData.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => setViewMode('all')}>
                    View All ({availabilityData.length} users)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedUser?.display_name} - Weekly Availability
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div>{selectedUser.display_name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div>{selectedUser.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Role</div>
                    <div>{selectedUser.team_role || selectedUser.job_title || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Weekly Schedule Grid */}
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map(day => {
                  const daySlots = selectedUser.availability_slots.filter(
                    slot => slot.day_of_week === day.value
                  );
                  
                  return (
                    <div key={day.value} className="border rounded-lg p-2">
                      <div className="text-center font-medium text-sm mb-2">
                        {day.short}
                      </div>
                      <div className="space-y-1">
                        {daySlots.length > 0 ? (
                          daySlots.map(slot => {
                            const typeInfo = getAvailabilityTypeInfo(slot.availability_type);
                            const colors = getAvailabilityColors(slot.availability_type);
                            
                            return (
                              <div
                                key={slot.id}
                                className={cn('p-1 rounded text-xs', colors)}
                              >
                                <div className="font-medium">
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </div>
                                <div>{typeInfo.label}</div>
                                {slot.notes && (
                                  <div className="truncate" title={slot.notes}>
                                    {slot.notes}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            No availability
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Availability Summary
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {AVAILABILITY_TYPES.map(type => {
                    const count = selectedUser.availability_slots.filter(
                      slot => slot.availability_type === type.value
                    ).length;
                    
                    return (
                      <div key={type.value} className="text-sm">
                        <div className="font-medium text-blue-800">{count}</div>
                        <div className="text-blue-700">{type.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};