import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, MapPin, Filter, Plus } from 'lucide-react';
import { useCalendarScheduling } from '@/hooks/useCalendarScheduling';
import { LocationFilter } from './LocationFilter';
import { TeamFilter } from './TeamFilter';
import { QuickScheduleDialog } from './QuickScheduleDialog';
import { EventDetailsPopover } from './EventDetailsPopover';
import { AvailabilityVisualization } from './AvailabilityVisualization';

interface CalendarSchedulingViewProps {
  defaultLocationId?: string;
  defaultTeamId?: string;
}

export const CalendarSchedulingView: React.FC<CalendarSchedulingViewProps> = ({
  defaultLocationId,
  defaultTeamId
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(defaultLocationId);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(defaultTeamId);
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const {
    events,
    instructorAvailability,
    isLoading,
    createBooking,
    updateBooking,
    deleteBooking
  } = useCalendarScheduling(selectedLocationId, selectedTeamId);

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start);
    setShowScheduleDialog(true);
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
  };

  const getInstructorStats = () => {
    const totalInstructors = instructorAvailability?.length || 0;
    const activeInstructors = events?.reduce((acc, event) => {
      acc.add(event.extendedProps.instructorId);
      return acc;
    }, new Set()).size || 0;
    
    return { totalInstructors, activeInstructors };
  };

  const { totalInstructors, activeInstructors } = getInstructorStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 animate-spin" />
            <span>Loading calendar...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Scheduling Calendar</h2>
          <p className="text-muted-foreground">
            Professional calendar-based scheduling with location and team filtering
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{totalInstructors} Instructors</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{activeInstructors} Active</span>
            </div>
            {selectedLocationId && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <Badge variant="outline">Location Filtered</Badge>
              </div>
            )}
          </div>
          
          <Button 
            onClick={() => setShowScheduleDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Quick Schedule
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Calendar Filters & Views
          </CardTitle>
          <CardDescription>
            Filter by location and team to focus on specific scheduling areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <LocationFilter
                selectedLocationId={selectedLocationId}
                onLocationChange={setSelectedLocationId}
              />
              <TeamFilter
                selectedTeamId={selectedTeamId}
                onTeamChange={setSelectedTeamId}
                locationId={selectedLocationId}
              />
            </div>

            {/* View Controls */}
            <Tabs value={calendarView} onValueChange={(value: any) => setCalendarView(value)}>
              <TabsList>
                <TabsTrigger value="dayGridMonth">Month</TabsTrigger>
                <TabsTrigger value="timeGridWeek">Week</TabsTrigger>
                <TabsTrigger value="timeGridDay">Day</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              initialView={calendarView}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={events}
              select={handleDateSelect}
              eventClick={handleEventClick}
              height="auto"
              slotMinTime="07:00:00"
              slotMaxTime="19:00:00"
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                startTime: '09:00',
                endTime: '17:00'
              }}
              eventDisplay="block"
              dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                omitZeroMinute: false,
                hour12: true
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Availability Analysis */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="availability">Availability Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar">
          {/* Color Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-sm">Course Instruction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-600 rounded"></div>
                  <span className="text-sm">Training Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm">Meeting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-600 rounded"></div>
                  <span className="text-sm">Administrative</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  <span className="text-sm">Personal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="availability">
          <AvailabilityVisualization
            instructorAvailability={instructorAvailability || []}
            events={events || []}
            selectedDate={selectedDate || new Date()}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Schedule Dialog */}
      <QuickScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        selectedDate={selectedDate}
        instructorAvailability={instructorAvailability}
        onSchedule={async (data) => {
          await createBooking.mutateAsync(data);
        }}
        locationId={selectedLocationId}
        teamId={selectedTeamId}
      />

      {/* Event Details Popover */}
      {selectedEvent && (
        <EventDetailsPopover
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={async (eventData) => {
            await updateBooking.mutateAsync(eventData);
            setSelectedEvent(null);
          }}
          onDelete={async (eventId) => {
            await deleteBooking.mutateAsync(eventId);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};