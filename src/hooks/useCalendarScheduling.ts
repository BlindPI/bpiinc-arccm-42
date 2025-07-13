import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  display?: string;
  extendedProps: {
    instructorId: string;
    instructorName: string;
    locationId?: string;
    locationName?: string;
    courseId?: string;
    courseName?: string;
    bookingType: string;
    status: string;
    description?: string;
  };
}

export interface InstructorAvailability {
  instructorId: string;
  instructorName: string;
  role: string;
  locationId?: string;
  teamId?: string;
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

// Helper function to generate availability background events
const generateAvailabilityBackgroundEvents = async (
  instructors: any[], 
  locationId?: string, 
  teamId?: string
): Promise<CalendarEvent[]> => {
  const availabilityEvents: CalendarEvent[] = [];
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 30); // Show 30 days of availability

  // Get team members to filter instructors
  let teamQuery = supabase
    .from('team_members')
    .select('user_id, team_id, teams!team_members_team_id_fkey(location_id)')
    .eq('status', 'active');

  if (locationId) teamQuery = teamQuery.eq('teams.location_id', locationId);
  if (teamId) teamQuery = teamQuery.eq('team_id', teamId);

  const { data: teamMembers } = await teamQuery;
  const instructorIds = teamMembers?.map(tm => tm.user_id) || [];

  instructors
    .filter(instructor => instructorIds.includes(instructor.id))
    .forEach(instructor => {
      instructor.user_availability?.forEach((avail: any) => {
        const dayOfWeek = parseInt(avail.day_of_week);
        
        // Generate availability windows for the next 30 days
        for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === dayOfWeek) {
            const startDateTime = new Date(d);
            const [startHour, startMin] = avail.start_time.split(':');
            startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
            
            const endDateTime = new Date(d);
            const [endHour, endMin] = avail.end_time.split(':');
            endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

            availabilityEvents.push({
              id: `avail-${instructor.id}-${d.toISOString().split('T')[0]}-${avail.start_time}`,
              title: `Available: ${instructor.display_name}`,
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
              backgroundColor: 'rgba(34, 197, 94, 0.1)', // light green
              borderColor: '#22c55e',
              textColor: '#16a34a',
              display: 'background', // Makes it a background event
              extendedProps: {
                instructorId: instructor.id,
                instructorName: instructor.display_name,
                bookingType: 'availability_window',
                status: 'available',
                locationId: '',
                locationName: '',
                courseId: '',
                courseName: ''
              }
            });
          }
        }
      });
    });

  return availabilityEvents;
};

export const useCalendarScheduling = (locationId?: string, teamId?: string) => {
  const queryClient = useQueryClient();

  // Get calendar events (bookings)
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['calendar-events', locationId, teamId],
    queryFn: async () => {
      // Get instructors first for availability windows
      let instructorQuery = supabase
        .from('profiles')
        .select(`
          id, display_name, role,
          user_availability (day_of_week, start_time, end_time)
        `)
        .in('role', ['IC', 'IP', 'IT']);

      const instructorResult = await instructorQuery;
      let query = supabase
        .from('availability_bookings')
        .select(`
          id, title, booking_date, start_time, end_time, 
          booking_type, status, course_id, description,
          user_id,
          profiles:user_id (display_name, role),
          courses:course_id (name),
          locations:team_id (name)
        `);

      // Apply location filter if provided
      if (locationId) {
        // Get team members for this location
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id, teams!inner(*)')
          .eq('teams.location_id', locationId)
          .eq('status', 'active');

        if (teamMembers?.length) {
          const userIds = teamMembers.map(tm => tm.user_id);
          query = query.in('user_id', userIds);
        }
      }

      // Apply team filter if provided
      if (teamId) {
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', teamId)
          .eq('status', 'active');

        if (teamMembers?.length) {
          const userIds = teamMembers.map(tm => tm.user_id);
          query = query.in('user_id', userIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

        // Also get availability windows as background events
        const availabilityEvents = await generateAvailabilityBackgroundEvents(
          instructorResult?.data || [], locationId, teamId
        );

        const bookingEvents = data?.map((booking: any): CalendarEvent => {
          const startDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
          const endDateTime = new Date(`${booking.booking_date}T${booking.end_time}`);

          // Color coding based on booking type
          let backgroundColor = '#3b82f6'; // blue for default
          let borderColor = '#1d4ed8';
          
          switch (booking.booking_type) {
            case 'course_instruction':
              backgroundColor = '#059669'; // green for courses
              borderColor = '#047857';
              break;
            case 'training_session':
              backgroundColor = '#7c3aed'; // purple for training
              borderColor = '#5b21b6';
              break;
            case 'meeting':
              backgroundColor = '#dc2626'; // red for meetings
              borderColor = '#991b1b';
              break;
            case 'administrative':
              backgroundColor = '#10b981'; // emerald for admin
              borderColor = '#047857';
              break;
            case 'personal':
              backgroundColor = '#6b7280'; // gray for personal
              borderColor = '#374151';
              break;
          }

          return {
            id: booking.id,
            title: booking.title,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            backgroundColor,
            borderColor,
            textColor: '#ffffff',
            extendedProps: {
              instructorId: booking.user_id,
              instructorName: booking.profiles?.display_name || 'Unknown',
              courseId: booking.course_id,
              courseName: booking.courses?.name,
              bookingType: booking.booking_type,
              status: booking.status,
              locationId: '',
              locationName: '',
              description: booking.description || ''
            }
          };
        }) || [];

        return [...bookingEvents, ...availabilityEvents];
    }
  });

  // Get instructor availability patterns
  const { data: instructorAvailability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['instructor-availability', locationId, teamId],
    queryFn: async () => {
      // First get the current user's role to apply proper filtering
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Build base query for instructors
      let instructorQuery = supabase
        .from('profiles')
        .select(`
          id, display_name, role,
          user_availability (day_of_week, start_time, end_time)
        `)
        .in('role', ['IC', 'IP', 'IT']);

      // Get team memberships separately to handle role-based filtering
      let teamQuery = supabase
        .from('team_members')
        .select(`
          user_id,
          team_id,
          teams!team_members_team_id_fkey(id, name, location_id)
        `)
        .eq('status', 'active');

      // Apply role-based location restrictions
      if (userProfile?.role === 'AP') {
        // AP users can only see instructors in their assigned locations
        const { data: assignments } = await supabase
          .from('ap_user_location_assignments')
          .select('location_id')
          .eq('ap_user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'active');

        const assignedLocationIds = assignments?.map(a => a.location_id) || [];
        if (assignedLocationIds.length > 0) {
          teamQuery = teamQuery.in('teams.location_id', assignedLocationIds);
        }
      }

      // Apply filters if provided
      if (locationId) {
        teamQuery = teamQuery.eq('teams.location_id', locationId);
      }
      if (teamId) {
        teamQuery = teamQuery.eq('team_id', teamId);
      }

      const [instructorResult, teamResult] = await Promise.all([
        instructorQuery,
        teamQuery
      ]);

      if (instructorResult.error) throw instructorResult.error;
      if (teamResult.error) throw teamResult.error;

      // Filter instructors based on team membership
      const instructorIds = teamResult.data?.map(tm => tm.user_id) || [];
      const filteredInstructors = instructorResult.data?.filter(instructor => 
        instructorIds.includes(instructor.id)
      ) || [];

      // Create a map of team info for each instructor
      const teamInfoMap = new Map();
      teamResult.data?.forEach(tm => {
        if (!teamInfoMap.has(tm.user_id)) {
          teamInfoMap.set(tm.user_id, []);
        }
        teamInfoMap.get(tm.user_id).push({
          teamId: tm.team_id,
          teamName: tm.teams?.name,
          locationId: tm.teams?.location_id
        });
      });

      return filteredInstructors.map((instructor: any): InstructorAvailability => ({
        instructorId: instructor.id,
        instructorName: instructor.display_name || 'Unknown',
        role: instructor.role,
        locationId: teamInfoMap.get(instructor.id)?.[0]?.locationId,
        teamId: teamInfoMap.get(instructor.id)?.[0]?.teamId,
        availability: instructor.user_availability?.map((avail: any) => ({
          dayOfWeek: parseInt(avail.day_of_week),
          startTime: avail.start_time,
          endTime: avail.end_time
        })) || []
      }));
    }
  });

  // Create new booking/schedule
  const createBooking = useMutation({
    mutationFn: async (bookingData: {
      instructorId: string;
      startDateTime: string;
      endDateTime: string;
      title: string;
      bookingType: 'course_instruction' | 'training_session' | 'meeting' | 'administrative' | 'personal';
      courseId?: string;
      description?: string;
    }) => {
      const startDate = new Date(bookingData.startDateTime);
      const endDate = new Date(bookingData.endDateTime);
      
      const booking = {
        user_id: bookingData.instructorId,
        booking_date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().split(' ')[0],
        end_time: endDate.toTimeString().split(' ')[0],
        title: bookingData.title,
        booking_type: bookingData.bookingType,
        course_id: bookingData.courseId,
        description: bookingData.description,
        status: 'scheduled'
      };

      const { data, error } = await supabase
        .from('availability_bookings')
        .insert(booking)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Course scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to schedule: ${error.message}`);
    }
  });

  // Update existing booking
  const updateBooking = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('availability_bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Schedule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  // Delete booking
  const deleteBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('availability_bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Schedule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });

  return {
    events,
    instructorAvailability,
    isLoading: eventsLoading || availabilityLoading,
    createBooking,
    updateBooking,
    deleteBooking
  };
};