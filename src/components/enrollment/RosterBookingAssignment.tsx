import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

interface RosterBookingAssignmentProps {
  rosterId: string;
  currentBookingId?: string;
  onUpdate?: () => void;
}

export function RosterBookingAssignment({ rosterId, currentBookingId, onUpdate }: RosterBookingAssignmentProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string>(currentBookingId || '');
  const queryClient = useQueryClient();

  // Fetch available bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['availability-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_bookings')
        .select(`
          id,
          title,
          booking_date,
          start_time,
          end_time,
          user_id
        `)
        .eq('booking_type', 'course_instruction')
        .is('roster_id', null)
        .order('booking_date', { ascending: true });

      if (error) throw error;
      
      // Get instructor names separately
      const bookingIds = data?.map(b => b.user_id).filter(Boolean) || [];
      const { data: instructors } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', bookingIds);

      return data?.map(booking => ({
        ...booking,
        instructor_name: instructors?.find(i => i.id === booking.user_id)?.display_name || 'Unknown'
      }));
    }
  });

  // Assign roster to booking
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBookingId) return;

      const { error } = await supabase
        .from('student_rosters')
        .update({ availability_booking_id: selectedBookingId })
        .eq('id', rosterId);

      if (error) throw error;

      // Also update the booking to reference this roster
      const { error: bookingError } = await supabase
        .from('availability_bookings')
        .update({ roster_id: rosterId })
        .eq('id', selectedBookingId);

      if (bookingError) throw bookingError;
    },
    onSuccess: () => {
      toast.success('Roster assigned to booking successfully');
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
      queryClient.invalidateQueries({ queryKey: ['availability-bookings'] });
      onUpdate?.();
    },
    onError: (error) => {
      console.error('Error assigning roster:', error);
      toast.error('Failed to assign roster to booking');
    }
  });

  if (isLoading) return <div>Loading bookings...</div>;

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Assign to Availability Booking</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Booking:</label>
        <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an availability booking..." />
          </SelectTrigger>
          <SelectContent>
            {bookings?.map((booking) => (
              <SelectItem key={booking.id} value={booking.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{booking.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {booking.booking_date} | {booking.start_time} - {booking.end_time}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Instructor: {booking.instructor_name}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={() => assignMutation.mutate()}
        disabled={!selectedBookingId || assignMutation.isPending}
        className="w-full"
      >
        {assignMutation.isPending ? 'Assigning...' : 'Assign Roster to Booking'}
      </Button>

      {currentBookingId && (
        <div className="text-sm text-muted-foreground">
          Currently assigned to booking: {currentBookingId}
        </div>
      )}
    </div>
  );
}