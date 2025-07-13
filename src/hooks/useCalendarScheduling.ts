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
  extendedProps: {
    instructorId: string;
    instructorName: string;
    locationId?: string;
    locationName?: string;
    courseId?: string;
    courseName?: string;
    bookingType: string;
    status: string;
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

export const useCalendarScheduling = (locationId?: string, teamId?: string) => {
  const queryClient = useQueryClient();

  // Get calendar events (bookings)
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['calendar-events', locationId, teamId],
    queryFn: async () => {
      let query = supabase
        .from('availability_bookings')
        .select(`
          id, title, booking_date, start_time, end_time, 
          booking_type, status, course_id,
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

      return data?.map((booking: any): CalendarEvent => {
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
            locationName: ''
          }
        };
      }) || [];
    }
  });

  // Get instructor availability patterns
  const { data: instructorAvailability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['instructor-availability', locationId, teamId],
    queryFn: async () => {
      let userQuery = supabase
        .from('profiles')
        .select(`
          id, display_name, role,
          user_availability (day_of_week, start_time, end_time),
          team_members!inner (team_id, teams!inner(location_id, name))
        `)
        .in('role', ['IC', 'IP', 'IT']);

      // Apply location filter
      if (locationId) {
        userQuery = userQuery.eq('team_members.teams.location_id', locationId);
      }

      // Apply team filter
      if (teamId) {
        userQuery = userQuery.eq('team_members.team_id', teamId);
      }

      const { data, error } = await userQuery;
      if (error) throw error;

      return data?.map((instructor: any): InstructorAvailability => ({
        instructorId: instructor.id,
        instructorName: instructor.display_name || 'Unknown',
        role: instructor.role,
        locationId: instructor.team_members?.[0]?.teams?.location_id,
        teamId: instructor.team_members?.[0]?.team_id,
        availability: instructor.user_availability?.map((avail: any) => ({
          dayOfWeek: parseInt(avail.day_of_week),
          startTime: avail.start_time,
          endTime: avail.end_time
        })) || []
      })) || [];
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