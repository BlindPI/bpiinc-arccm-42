import React, { useState, useRef, useEffect } from 'react';
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
import { InstructorAvailabilityDropdown } from './InstructorAvailabilityDropdown';

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
  const calendarRef = useRef<FullCalendar>(null);

  const {
    events,
    instructorAvailability,
    isLoading,
    createBooking,
    updateBooking,
    deleteBooking
  } = useCalendarScheduling(selectedLocationId, selectedTeamId);

  // Handle calendar view changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(calendarView);
    }
  }, [calendarView]);

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
    <div className="space-y-4">
      {/* Clean Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        
        <div className="flex items-center gap-2">
          <InstructorAvailabilityDropdown
            instructorAvailability={instructorAvailability || []}
            selectedDate={selectedDate || new Date()}
            onInstructorSelect={(instructorId) => {
              console.log('Selected instructor:', instructorId);
            }}
          />
          <Button 
            onClick={() => setShowScheduleDialog(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Clean Calendar */}
      <div className="bg-background border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Instructor Scheduling</h3>
          </div>
          <Tabs value={calendarView} onValueChange={(value: any) => setCalendarView(value)}>
            <TabsList className="grid w-48 grid-cols-3">
              <TabsTrigger value="dayGridMonth">Month</TabsTrigger>
              <TabsTrigger value="timeGridWeek">Week</TabsTrigger>
              <TabsTrigger value="timeGridDay">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
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
      </div>

      {/* Compact Legend */}
      <div className="flex items-center gap-6 text-sm bg-muted/50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500/20 border border-green-500 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span>Course</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-600 rounded"></div>
          <span>Training</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded"></div>
          <span>Meeting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-600 rounded"></div>
          <span>Admin</span>
        </div>
      </div>

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