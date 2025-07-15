import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, UserMinus, GraduationCap, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface ParticipantAssignmentProps {
  eventId: string;
  eventTitle: string;
  onParticipantsChange?: () => void;
}

export function ParticipantAssignment({ 
  eventId, 
  eventTitle, 
  onParticipantsChange 
}: ParticipantAssignmentProps) {
  const [selectedRosterId, setSelectedRosterId] = useState('');
  const queryClient = useQueryClient();

  // Get available training rosters
  const { data: rosters = [] } = useQuery({
    queryKey: ['student-rosters-training'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_rosters')
        .select(`
          id, roster_name, course_name, roster_type,
          current_enrollment, max_capacity, roster_status,
          locations:location_id (name, city)
        `)
        .eq('roster_type', 'TRAINING')
        .eq('roster_status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Get current participants for this event
  const { data: participants = [] } = useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: async () => {
      // Get the roster assigned to this booking
      const { data: roster, error: rosterError } = await supabase
        .from('student_rosters')
        .select('id')
        .eq('availability_booking_id', eventId)
        .single();

      if (rosterError || !roster?.id) return [];

      // Get students from the assigned roster
      const { data: students, error: studentsError } = await supabase
        .from('student_roster_members')
        .select(`
          student_enrollment_profiles(
            id, display_name, email, first_name, last_name
          )
        `)
        .eq('roster_id', roster.id)
        .eq('enrollment_status', 'enrolled');

      if (studentsError) throw studentsError;

      return students?.map((member: any) => ({
        id: member.student_enrollment_profiles.id,
        name: member.student_enrollment_profiles.display_name || 
              `${member.student_enrollment_profiles.first_name || ''} ${member.student_enrollment_profiles.last_name || ''}`.trim(),
        email: member.student_enrollment_profiles.email,
      })) || [];
    }
  });

  // Assign roster to event and create enrollment records
  const assignRoster = useMutation({
    mutationFn: async (rosterId: string) => {
      // First update the roster with the booking assignment
      const { data, error } = await supabase
        .from('student_rosters')
        .update({ availability_booking_id: eventId })
        .eq('id', rosterId)
        .select()
        .single();

      if (error) throw error;

      // Get students from the roster to create enrollment records
      const { data: rosterMembers, error: membersError } = await supabase
        .from('student_roster_members')
        .select('student_profile_id')
        .eq('roster_id', rosterId)
        .eq('enrollment_status', 'enrolled');

      if (membersError) throw membersError;

      // Create enrollment records for each student
      if (rosterMembers && rosterMembers.length > 0) {
        const enrollments = rosterMembers.map(member => ({
          user_id: member.student_profile_id,
          course_offering_id: eventId, // Using eventId as course offering reference
          status: 'ENROLLED',
          enrollment_date: new Date().toISOString()
        }));

        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .upsert(enrollments, { onConflict: 'user_id,course_offering_id' });

        if (enrollmentError) {
          console.warn('Failed to create enrollment records:', enrollmentError);
        }
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Training roster assigned to session and enrollments created');
      queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments-filtered'] });
      onParticipantsChange?.();
      setSelectedRosterId('');
    },
    onError: (error: any) => {
      toast.error(`Failed to assign roster: ${error.message}`);
    }
  });

  const handleAssignRoster = () => {
    if (!selectedRosterId) return;
    assignRoster.mutate(selectedRosterId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participant Management
          </CardTitle>
          <CardDescription>
            Assign participants to this training session: {eventTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Roster Assignment */}
          <div className="flex gap-2">
            <Select value={selectedRosterId} onValueChange={setSelectedRosterId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a roster to assign..." />
              </SelectTrigger>
              <SelectContent>
                {rosters.map((roster) => (
                  <SelectItem key={roster.id} value={roster.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{roster.roster_name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="outline" className="text-xs">
                          {roster.current_enrollment}/{roster.max_capacity} students
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {roster.course_name}
                        </Badge>
                        {roster.locations && (
                          <Badge variant="outline" className="text-xs">
                            {roster.locations.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAssignRoster}
              disabled={!selectedRosterId || assignRoster.isPending}
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Assign Roster
            </Button>
          </div>

          {/* Current Participants */}
          {participants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Current Participants ({participants.length})</h4>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {participants.map((participant: any) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {participant.name?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{participant.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {participant.status || 'Enrolled'}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {participants.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No participants assigned yet</p>
              <p className="text-xs">Assign a roster to add participants to this training session</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}