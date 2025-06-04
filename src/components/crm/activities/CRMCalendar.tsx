import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Phone,
  Video,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Target,
  Building
} from 'lucide-react';
import { crmActivityService } from '@/services/crm/crmActivityService';
import { CRMActivity, CreateActivityData } from '@/types/crm';

interface CalendarEvent extends CRMActivity {
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
}

interface CRMCalendarProps {
  leadId?: string;
  opportunityId?: string;
  view?: 'month' | 'week' | 'day';
}

export function CRMCalendar({ leadId, opportunityId, view = 'month' }: CRMCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(view);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<CreateActivityData>>({
    activity_type: 'meeting',
    meeting_type: 'in_person'
  });

  const queryClient = useQueryClient();

  // Calculate date range for current view
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (currentView) {
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        end.setDate(start.getDate() + 6);
        break;
      case 'day':
        end.setDate(start.getDate());
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // Real calendar data
  const { data: calendarEvents, isLoading } = useQuery({
    queryKey: ['crm', 'calendar', currentDate, currentView, leadId, opportunityId],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const result = await crmActivityService.getActivities({
        lead_id: leadId,
        opportunity_id: opportunityId,
        date_from: startDate,
        date_to: endDate
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Transform activities to calendar events
      return result.data?.data?.map(activity => ({
        ...activity,
        start_time: activity.activity_date,
        end_time: activity.duration_minutes 
          ? new Date(new Date(activity.activity_date).getTime() + activity.duration_minutes * 60000).toISOString()
          : activity.activity_date,
        all_day: !activity.duration_minutes
      })) || [];
    },
    staleTime: 30000,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateActivityData) => {
      const result = await crmActivityService.createActivity(eventData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'calendar'] });
      setShowCreateDialog(false);
      setNewEvent({ activity_type: 'meeting', meeting_type: 'in_person' });
    },
  });

  const events = calendarEvents || [];

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => 
      event.activity_date.startsWith(dateStr)
    );
  };

  // Generate calendar grid for month view
  const generateMonthGrid = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  };

  // Generate week grid
  const generateWeekGrid = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Users,
      demo: Target,
      proposal: Building,
      follow_up: Clock
    };
    return icons[type as keyof typeof icons] || Calendar;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      call: 'bg-blue-100 text-blue-800 border-blue-200',
      email: 'bg-green-100 text-green-800 border-green-200',
      meeting: 'bg-purple-100 text-purple-800 border-purple-200',
      demo: 'bg-orange-100 text-orange-800 border-orange-200',
      proposal: 'bg-red-100 text-red-800 border-red-200',
      follow_up: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-CA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleCreateEvent = () => {
    if (!newEvent.subject || !newEvent.activity_date) return;

    const eventData: CreateActivityData = {
      lead_id: leadId,
      opportunity_id: opportunityId,
      activity_type: newEvent.activity_type as any,
      subject: newEvent.subject,
      description: newEvent.description,
      activity_date: newEvent.activity_date,
      duration_minutes: newEvent.duration_minutes,
      meeting_type: newEvent.meeting_type as any,
      location: newEvent.location,
      attendees: newEvent.attendees
    };

    createEventMutation.mutate(eventData);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setNewEvent(prev => ({
      ...prev,
      activity_date: date.toISOString().split('T')[0] + 'T09:00'
    }));
    setShowCreateDialog(true);
  };

  const renderMonthView = () => {
    const days = generateMonthGrid();
    const today = new Date();
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === today.toDateString();
          const dayEvents = getEventsForDate(day);
          
          return (
            <div
              key={index}
              className={`min-h-[120px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => {
                  const ActivityIcon = getActivityIcon(event.activity_type);
                  return (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded border truncate ${getActivityColor(event.activity_type)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <ActivityIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{event.subject}</span>
                      </div>
                      {!event.all_day && (
                        <div className="text-xs opacity-75">
                          {formatTime(event.activity_date)}
                        </div>
                      )}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = generateWeekGrid();
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-2"></div>
          {days.map(day => (
            <div key={day.toISOString()} className="p-2 text-center border-l">
              <div className="text-sm font-medium">{day.toLocaleDateString('en-CA', { weekday: 'short' })}</div>
              <div className="text-lg">{day.getDate()}</div>
            </div>
          ))}
        </div>
        
        {/* Time slots */}
        <div className="flex-1 overflow-y-auto max-h-[600px]">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
              <div className="p-2 text-sm text-gray-500 border-r">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map(day => {
                const dayEvents = getEventsForDate(day).filter(event => {
                  const eventHour = new Date(event.activity_date).getHours();
                  return eventHour === hour;
                });
                
                return (
                  <div key={`${day.toISOString()}-${hour}`} className="p-1 border-l relative">
                    {dayEvents.map(event => {
                      const ActivityIcon = getActivityIcon(event.activity_type);
                      return (
                        <div
                          key={event.id}
                          className={`text-xs p-2 rounded border mb-1 ${getActivityColor(event.activity_type)}`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <ActivityIcon className="h-3 w-3" />
                            <span className="font-medium truncate">{event.subject}</span>
                          </div>
                          <div className="text-xs opacity-75">
                            {formatTime(event.activity_date)}
                            {event.duration_minutes && ` (${event.duration_minutes}m)`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium">
            {currentDate.toLocaleDateString('en-CA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = new Date(event.activity_date).getHours();
              return eventHour === hour;
            });
            
            return (
              <div key={hour} className="flex border-b pb-2">
                <div className="w-20 text-sm text-gray-500 pt-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 space-y-2">
                  {hourEvents.length === 0 ? (
                    <div className="h-12 border-l-2 border-gray-200"></div>
                  ) : (
                    hourEvents.map(event => {
                      const ActivityIcon = getActivityIcon(event.activity_type);
                      return (
                        <Card key={event.id} className="cursor-pointer hover:shadow-md">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <ActivityIcon className="h-4 w-4 text-gray-600" />
                                <div>
                                  <h4 className="font-medium">{event.subject}</h4>
                                  <div className="text-sm text-gray-600">
                                    {formatTime(event.activity_date)}
                                    {event.duration_minutes && ` - ${formatTime(event.end_time || event.activity_date)}`}
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <MapPin className="h-3 w-3" />
                                      {event.location}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getActivityColor(event.activity_type)}`}>
                                {event.activity_type}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <h2 className="text-xl font-semibold">
            {currentView === 'month' && currentDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
            {currentView === 'week' && `Week of ${currentDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`}
            {currentView === 'day' && currentDate.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Event</DialogTitle>
                <DialogDescription>
                  Create a new calendar event or meeting
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Event Title</Label>
                  <Input
                    value={newEvent.subject || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={newEvent.activity_type}
                    onValueChange={(value) => setNewEvent(prev => ({ ...prev, activity_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Meeting Type</Label>
                  <Select
                    value={newEvent.meeting_type}
                    onValueChange={(value) => setNewEvent(prev => ({ ...prev, meeting_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.activity_date?.slice(0, 16)}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, activity_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={newEvent.duration_minutes || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                    placeholder="60"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Location</Label>
                  <Input
                    value={newEvent.location || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Meeting location or video link"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description and agenda"
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateEvent}
                  disabled={createEventMutation.isPending || !newEvent.subject}
                >
                  {createEventMutation.isPending ? 'Creating...' : 'Schedule Event'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading calendar...</p>
            </div>
          ) : (
            <>
              {currentView === 'month' && renderMonthView()}
              {currentView === 'week' && renderWeekView()}
              {currentView === 'day' && renderDayView()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent.subject}</DialogTitle>
              <DialogDescription>
                {new Date(selectedEvent.activity_date).toLocaleDateString('en-CA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} at {formatTime(selectedEvent.activity_date)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedEvent.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.location && (
                <div>
                  <Label>Location</Label>
                  <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                </div>
              )}
              
              {selectedEvent.duration_minutes && (
                <div>
                  <Label>Duration</Label>
                  <p className="text-sm text-gray-600">{selectedEvent.duration_minutes} minutes</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              <Button>
                Edit Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}