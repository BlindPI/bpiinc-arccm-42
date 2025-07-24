import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from 'lucide-react';
import { useMonthlyAvailability, useAvailableUsersInRange } from '@/hooks/useMonthlyAvailability';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { MonthlyAvailabilitySlot } from '@/types/availability';

interface AvailabilityCalendarProps {
  showCurrentUserOnly?: boolean; // For profile page vs dashboard
  allowUserSelection?: boolean; // For SA/AD users to see everyone
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ 
  showCurrentUserOnly = false,
  allowUserSelection = true 
}) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculate month start and end dates
  const monthStart = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return start;
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return end;
  }, [currentDate]);

  // Role-based access control
  const isAdmin = profile?.role === 'SA' || profile?.role === 'AD';
  const isAP = profile?.role === 'AP';
  const canViewAllUsers = isAdmin && allowUserSelection && !showCurrentUserOnly;

  // Determine which user IDs to fetch
  const userIdsToFetch = useMemo(() => {
    // Profile page - current user only
    if (showCurrentUserOnly && user?.id) {
      return [user.id];
    }
    
    // AP users - let database handle team access (return undefined)
    if (isAP) {
      return undefined; // Database will return user + their team members
    }
    
    // IT/IP/IC users - current user only
    if (!canViewAllUsers && !isAP && user?.id) {
      return [user.id];
    }
    
    // SA/AD with specific user selection
    if (selectedUserId !== 'all') {
      return [selectedUserId];
    }
    
    // SA/AD viewing all users
    return undefined; // Will fetch all accessible users based on role
  }, [showCurrentUserOnly, canViewAllUsers, selectedUserId, user?.id, isAP]);

  // Fetch monthly availability
  const { monthlyAvailability, isLoading, error, refetch } = useMonthlyAvailability({
    startDate: monthStart,
    endDate: monthEnd,
    userIds: userIdsToFetch
  });

  // Fetch available users for dropdown (only if admin can view all users)
  const { availableUsers } = useAvailableUsersInRange({
    startDate: monthStart,
    endDate: monthEnd
  });

  // Calendar generation
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get availability for a specific date
  const getAvailabilityForDate = (date: Date) => {
    if (!date || !monthlyAvailability) return [];
    
    const dateString = date.toISOString().split('T')[0];
    
    return monthlyAvailability.filter(slot => 
      slot.availability_date === dateString
    ).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Format time
  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  // Get availability type color
  const getAvailabilityColor = (type: string) => {
    switch (type) {
      case 'available': return 'bg-green-200 text-green-800 border-green-300';
      case 'busy': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
      case 'out_of_office': return 'bg-red-200 text-red-800 border-red-300';
      case 'tentative': return 'bg-blue-200 text-blue-800 border-blue-300';
      default: return 'bg-gray-200 text-gray-800 border-gray-300';
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Availability data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading availability data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            Error loading availability: {error.message}
            <Button onClick={handleRefresh} variant="outline" size="sm" className="ml-2">
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {showCurrentUserOnly ? 'My Availability Calendar' : 'User Availability Calendar'}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {canViewAllUsers && availableUsers && availableUsers.length > 0 && (
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {availableUsers.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{monthYear}</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-600 border-b">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const availability = date ? getAvailabilityForDate(date) : [];
              const hasAvailability = availability.length > 0;
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                    ${!date ? 'bg-gray-50' : ''}
                    ${hasAvailability ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}
                    ${selectedDate && date && date.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-blue-500' : ''}
                  `}
                  onClick={() => date && setSelectedDate(date)}
                >
                  {date && (
                    <>
                      <div className="text-sm font-medium mb-1">
                        {date.getDate()}
                      </div>
                      {availability.length > 0 && (
                        <div className="space-y-1">
                          {availability.slice(0, 2).map((slot, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-1 py-0.5 rounded truncate ${getAvailabilityColor(slot.availability_type)}`}
                              title={`${slot.display_name || 'User'}: ${formatTime(slot.start_time)} - ${formatTime(slot.end_time)} (${slot.availability_type})`}
                            >
                              {slot.display_name || 'User'}
                            </div>
                          ))}
                          {availability.length > 2 && (
                            <div className="text-xs text-gray-600">
                              +{availability.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const dayAvailability = getAvailabilityForDate(selectedDate);
              
              if (dayAvailability.length === 0) {
                return (
                  <div className="text-gray-500 text-center py-4">
                    No availability scheduled for this date
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {dayAvailability.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {slot.display_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {slot.email} • {slot.role}
                        </div>
                        {slot.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            Notes: {slot.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded ${getAvailabilityColor(slot.availability_type)}`}>
                          {slot.availability_type}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {slot.is_recurring ? 'Recurring' : 'Specific Date'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AvailabilityCalendar;