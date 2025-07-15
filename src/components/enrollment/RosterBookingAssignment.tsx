import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Calendar, User, Clock, X } from 'lucide-react';

interface RosterBookingAssignmentProps {
  rosterId: string;
  currentBookingId?: string;
  onUpdate?: () => void;
}

export function RosterBookingAssignment({ rosterId, currentBookingId, onUpdate }: RosterBookingAssignmentProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const queryClient = useQueryClient();

  // Get current roster with booking information
  const { data: currentRoster, isLoading: rosterLoading } = useQuery({
    queryKey: ['roster-with-booking', rosterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_rosters')
        .select(`
          id,
          roster_name,
          availability_booking_id,
          availability_bookings!student_rosters_availability_booking_id_fkey(
            id,
            title,
            booking_date,
            start_time,
            end_time,
            user_id,
            profiles!availability_bookings_user_id_fkey(display_name)
          )
        `)
        .eq('id', rosterId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Update selected booking when current roster data loads
  useEffect(() => {
    if (currentRoster?.availability_booking_id) {
      setSelectedBookingId(currentRoster.availability_booking_id);
    }
  }, [currentRoster]);

  // Fetch available bookings with conflict detection
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['availability-bookings-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_bookings')
        .select(`
          id,
          title,
          booking_date,
          start_time,
          end_time,
          user_id,
          roster_id,
          student_rosters!availability_bookings_roster_id_fkey(
            id,
            roster_name
          ),
          profiles!availability_bookings_user_id_fkey(display_name)
        `)
        .eq('booking_type', 'course_instruction')
        .order('booking_date', { ascending: true });

      if (error) throw error;

      return data?.map(booking => ({
        ...booking,
        instructor_name: booking.profiles?.display_name || 'Unknown',
        isAssigned: !!booking.roster_id,
        assignedRosterName: booking.student_rosters?.roster_name || null,
        isCurrentAssignment: booking.roster_id === rosterId,
        hasConflict: booking.roster_id && booking.roster_id !== rosterId
      }));
    }
  });

  // Assign roster to booking
  const assignMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!bookingId) return;

      const { error } = await supabase
        .from('student_rosters')
        .update({ availability_booking_id: bookingId })
        .eq('id', rosterId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Roster assigned to booking successfully');
      queryClient.invalidateQueries({ queryKey: ['roster-with-booking'] });
      queryClient.invalidateQueries({ queryKey: ['availability-bookings-for-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
      onUpdate?.();
    },
    onError: (error) => {
      console.error('Error assigning roster:', error);
      toast.error('Failed to assign roster to booking');
    }
  });

  // Unassign roster from booking
  const unassignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('student_rosters')
        .update({ availability_booking_id: null })
        .eq('id', rosterId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Roster unassigned from booking');
      setSelectedBookingId('');
      queryClient.invalidateQueries({ queryKey: ['roster-with-booking'] });
      queryClient.invalidateQueries({ queryKey: ['availability-bookings-for-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
      onUpdate?.();
    },
    onError: (error) => {
      console.error('Error unassigning roster:', error);
      toast.error('Failed to unassign roster');
    }
  });

  if (rosterLoading || bookingsLoading) return <div>Loading...</div>;

  const availableBookings = bookings?.filter(b => !b.hasConflict) || [];
  const conflictedBookings = bookings?.filter(b => b.hasConflict) || [];

  return (
    <div className="space-y-6">
      {/* Current Assignment Status */}
      {currentRoster?.availability_bookings ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Currently Assigned
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="font-medium">{currentRoster.availability_bookings.title}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(currentRoster.availability_bookings.booking_date).toLocaleDateString()} 
                  at {currentRoster.availability_bookings.start_time} - {currentRoster.availability_bookings.end_time}
                </span>
              </div>
              {currentRoster.availability_bookings.profiles && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <User className="h-4 w-4" />
                  <span>Instructor: {currentRoster.availability_bookings.profiles.display_name}</span>
                </div>
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                  <X className="h-4 w-4 mr-2" />
                  Unassign from Booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unassign Roster from Booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the roster assignment from the booking "{currentRoster.availability_bookings.title}". 
                    The booking will become available for other rosters.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => unassignMutation.mutate()}
                    disabled={unassignMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {unassignMutation.isPending ? 'Unassigning...' : 'Unassign'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">This roster is not assigned to any booking</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Interface */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentRoster?.availability_bookings ? 'Reassign to Different Booking' : 'Assign to Booking'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Booking:</label>
            <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an availability booking..." />
              </SelectTrigger>
              <SelectContent>
                {availableBookings.map((booking) => (
                  <SelectItem key={booking.id} value={booking.id}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium flex items-center gap-2">
                        {booking.title}
                        {booking.isCurrentAssignment && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                        {booking.isAssigned && !booking.isCurrentAssignment && (
                          <Badge variant="outline" className="text-xs text-blue-600">
                            Assigned to {booking.assignedRosterName}
                          </Badge>
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(booking.booking_date).toLocaleDateString()} | {booking.start_time} - {booking.end_time}
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
            onClick={() => assignMutation.mutate(selectedBookingId)}
            disabled={!selectedBookingId || selectedBookingId === currentRoster?.availability_booking_id || assignMutation.isPending}
            className="w-full"
          >
            {assignMutation.isPending ? 'Assigning...' : 
             currentRoster?.availability_bookings ? 'Reassign Roster' : 'Assign Roster to Booking'}
          </Button>
        </CardContent>
      </Card>

      {/* Conflicted Bookings Warning */}
      {conflictedBookings.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Bookings with Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-3">
              These bookings are already assigned to other rosters. To assign this roster to any of these bookings, 
              the other roster must be unassigned first.
            </p>
            <div className="space-y-2">
              {conflictedBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{booking.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(booking.booking_date).toLocaleDateString()} | {booking.start_time} - {booking.end_time}
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Assigned to {booking.assignedRosterName}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}