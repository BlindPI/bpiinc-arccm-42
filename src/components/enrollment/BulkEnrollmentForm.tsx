import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Users, AlertCircle, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { findOrCreateStudentProfile } from '@/services/studentProfileService';

export function BulkEnrollmentForm() {
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [emailList, setEmailList] = useState('');
  const [enrollmentResults, setEnrollmentResults] = useState<{
    successful: string[];
    failed: Array<{ email: string; reason: string }>;
  } | null>(null);

  const queryClient = useQueryClient();

  const { data: availabilityBookings = [] } = useQuery({
    queryKey: ['availability-bookings-bulk'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_bookings')
        .select(`
          id,
          title,
          booking_date,
          start_time,
          end_time,
          course_id,
          courses:course_id(name),
          user_id
        `)
        .eq('booking_type', 'course_instruction')
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const bulkEnrollMutation = useMutation({
    mutationFn: async ({ bookingId, emails }: { bookingId: string; emails: string[] }) => {
      const results = {
        successful: [] as string[],
        failed: [] as Array<{ email: string; reason: string }>
      };

      // Get the booking details
      const { data: booking } = await supabase
        .from('availability_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Create a roster for this booking
      const rosterName = `${booking.title} - ${new Date(booking.booking_date).toLocaleDateString()}`;
      const { data: roster, error: rosterError } = await supabase
        .from('student_rosters')
        .insert({
          course_name: booking.title,
          roster_name: rosterName,
          availability_booking_id: bookingId,
          max_capacity: emails.length
        })
        .select()
        .single();

      if (rosterError || !roster) {
        throw new Error('Failed to create roster: ' + rosterError?.message);
      }

      for (const email of emails) {
        try {
          // Find or create student profile
          const studentId = await findOrCreateStudentProfile(email.trim());
          
          if (!studentId) {
            results.failed.push({ email, reason: 'Failed to create student profile' });
            continue;
          }

          // Check if already in this roster
          const { data: existingMember } = await supabase
            .from('student_roster_members')
            .select('id')
            .eq('student_profile_id', studentId)
            .eq('roster_id', roster.id)
            .single();

          if (existingMember) {
            results.failed.push({ email, reason: 'Already in roster' });
            continue;
          }

          // Add to roster with course assignment
          const { error: memberError } = await supabase
            .from('student_roster_members')
            .insert({
              roster_id: roster.id,
              student_profile_id: studentId,
              course_id: booking.course_id,
              enrollment_status: 'enrolled'
            });

          if (memberError) {
            results.failed.push({ email, reason: memberError.message });
          } else {
            results.successful.push(email);
          }
        } catch (error) {
          results.failed.push({ email, reason: 'Unknown error' });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setEnrollmentResults(results);
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
      queryClient.invalidateQueries({ queryKey: ['availability-bookings'] });
      toast.success(`Bulk enrollment completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    },
    onError: (error) => {
      toast.error('Bulk enrollment failed');
      console.error('Bulk enrollment error:', error);
    }
  });

  const handleBulkEnroll = () => {
    if (!selectedBooking || !emailList.trim()) {
      toast.error('Please select an availability booking and provide email addresses');
      return;
    }

    const emails = emailList
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      toast.error('No valid email addresses found');
      return;
    }

    bulkEnrollMutation.mutate({ bookingId: selectedBooking, emails });
  };

  const resetForm = () => {
    setSelectedBooking('');
    setEmailList('');
    setEnrollmentResults(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking">Availability Booking</Label>
            <Select value={selectedBooking} onValueChange={setSelectedBooking}>
              <SelectTrigger>
                <SelectValue placeholder="Select an availability booking" />
              </SelectTrigger>
              <SelectContent>
                {availabilityBookings.map((booking) => (
                  <SelectItem key={booking.id} value={booking.id}>
                    <div className="flex flex-col">
                      <span>{booking.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {booking.courses?.name} - {new Date(booking.booking_date).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emails">Email Addresses</Label>
            <Textarea
              id="emails"
              placeholder="Enter email addresses, one per line&#10;example@domain.com&#10;another@domain.com"
              value={emailList}
              onChange={(e) => setEmailList(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Enter one email address per line. Student profiles will be created automatically if they don't exist.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleBulkEnroll}
              disabled={bulkEnrollMutation.isPending || !selectedBooking || !emailList.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {bulkEnrollMutation.isPending ? 'Processing...' : 'Enroll Students'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {enrollmentResults && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrollmentResults.successful.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Successfully enrolled ({enrollmentResults.successful.length})
                  </span>
                </div>
                <div className="bg-green-50 p-3 rounded border text-sm">
                  {enrollmentResults.successful.join(', ')}
                </div>
              </div>
            )}

            {enrollmentResults.failed.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Failed enrollments ({enrollmentResults.failed.length})
                  </span>
                </div>
                <div className="bg-red-50 p-3 rounded border space-y-1 text-sm">
                  {enrollmentResults.failed.map((failure, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{failure.email}</span>
                      <span className="text-red-600">{failure.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}