import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Clock, AlertCircle, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWaitlist, useCreateEnrollment } from '@/hooks/useEnrollment';
import { StudentSelector } from './StudentSelector';
import { toast } from 'sonner';

export function WaitlistManager() {
  const [selectedOffering, setSelectedOffering] = useState<string>('');
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const queryClient = useQueryClient();

  const { data: courseOfferings = [] } = useQuery({
    queryKey: ['availability-bookings-for-waitlist'],
    queryFn: async () => {
      // Get bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('availability_bookings')
        .select(`
          id,
          title,
          booking_date,
          start_time,
          end_time,
          booking_type,
          description
        `)
        .in('booking_type', ['training_session', 'course_instruction'])
        .order('booking_date', { ascending: true });

      if (bookingsError) throw bookingsError;

      // Get rosters that have bookings assigned
      const { data: rosters, error: rostersError } = await supabase
        .from('student_rosters')
        .select(`
          id,
          roster_name,
          max_capacity,
          availability_booking_id
        `)
        .not('availability_booking_id', 'is', null);

      if (rostersError) throw rostersError;

      // Create roster map
      const rosterMap = new Map();
      rosters?.forEach(roster => {
        if (roster.availability_booking_id) {
          rosterMap.set(roster.availability_booking_id, roster);
        }
      });

      // Filter bookings that have rosters and add roster info
      return bookings?.filter(booking => rosterMap.has(booking.id))
        .map(booking => ({
          ...booking,
          student_rosters: rosterMap.get(booking.id)
        })) || [];
    }
  });

  const { data: waitlistedStudents = [], isLoading } = useWaitlist(selectedOffering);
  const createEnrollment = useCreateEnrollment();

  const addToWaitlist = useMutation({
    mutationFn: async ({ studentId, bookingId }: { studentId: string; bookingId: string }) => {
      // First get the roster assigned to this booking
      const { data: roster, error: rosterError } = await supabase
        .from('student_rosters')
        .select('id')
        .eq('availability_booking_id', bookingId)
        .single();

      if (rosterError || !roster?.id) {
        throw new Error('No roster found for this booking');
      }

      // Check if student is already in the roster
      const { data: existing, error: existingError } = await supabase
        .from('student_roster_members')
        .select('id')
        .eq('roster_id', roster.id)
        .eq('student_profile_id', studentId)
        .single();

      if (!existingError && existing) {
        throw new Error('Student is already in this roster');
      }

      // Add student to roster with waitlisted status
      const { data, error } = await supabase
        .from('student_roster_members')
        .insert([{
          roster_id: roster.id,
          student_profile_id: studentId,
          enrollment_status: 'waitlisted',
          enrolled_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', selectedOffering] });
      queryClient.invalidateQueries({ queryKey: ['roster-members'] });
      toast.success('Student added to waitlist successfully');
      setShowStudentSelector(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to add student to waitlist: ${error.message}`);
    }
  });

  const handleAddToWaitlist = (student: any) => {
    if (!selectedOffering) return;
    addToWaitlist.mutate({ 
      studentId: student.id, 
      bookingId: selectedOffering 
    });
  };

  const promoteFromWaitlist = async (studentProfileId: string) => {
    if (!selectedOffering) return;
    
    try {
      // First get the roster assigned to this booking
      const { data: roster, error: rosterError } = await supabase
        .from('student_rosters')
        .select('id')
        .eq('availability_booking_id', selectedOffering)
        .single();

      if (rosterError || !roster?.id) {
        throw new Error('No roster found for this booking');
      }

      // Update the student's status from waitlisted to enrolled
      const { error } = await supabase
        .from('student_roster_members')
        .update({ enrollment_status: 'enrolled' })
        .eq('roster_id', roster.id)
        .eq('student_profile_id', studentProfileId)
        .eq('enrollment_status', 'waitlisted');

      if (error) throw error;

      // Refresh the waitlist
      queryClient.invalidateQueries({ queryKey: ['waitlist', selectedOffering] });
      queryClient.invalidateQueries({ queryKey: ['roster-members'] });
      toast.success('Student promoted to enrolled successfully');
    } catch (error) {
      console.error('Failed to promote from waitlist:', error);
      toast.error('Failed to promote student from waitlist');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Waitlist Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedOffering} onValueChange={setSelectedOffering}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course offering" />
                </SelectTrigger>
                <SelectContent>
                  {courseOfferings.map((offering) => (
                    <SelectItem key={offering.id} value={offering.id}>
                      <div className="flex flex-col">
                        <span>{offering.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {offering.booking_type} - {new Date(offering.booking_date).toLocaleDateString()} at {offering.start_time}
                          {offering.student_rosters?.roster_name && ` (${offering.student_rosters.roster_name})`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedOffering && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Waitlisted Students</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {waitlistedStudents.length} students waiting
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => setShowStudentSelector(true)}
                    disabled={addToWaitlist.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Waitlist
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : waitlistedStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students on the waitlist for this course</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {waitlistedStudents.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{student.student_enrollment_profiles?.display_name}</p>
                          <p className="text-sm text-muted-foreground">{student.student_enrollment_profiles?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Position #{index + 1}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => promoteFromWaitlist(student.student_profile_id)}
                          disabled={createEnrollment.isPending}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Promote
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <StudentSelector
        open={showStudentSelector}
        onClose={() => setShowStudentSelector(false)}
        onSelectStudent={handleAddToWaitlist}
        title="Add Student to Waitlist"
      />
    </div>
  );
}
