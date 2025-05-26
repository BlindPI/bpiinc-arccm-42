
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Clock, AlertCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWaitlist, useCreateEnrollment } from '@/hooks/useEnrollment';

export function WaitlistManager() {
  const [selectedOffering, setSelectedOffering] = useState<string>('');

  const { data: courseOfferings = [] } = useQuery({
    queryKey: ['course-offerings-for-waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_offerings')
        .select(`
          id,
          start_date,
          end_date,
          max_participants,
          courses:course_id(name),
          locations:location_id(name)
        `)
        .eq('status', 'SCHEDULED')
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const { data: waitlistedStudents = [], isLoading } = useWaitlist(selectedOffering);
  const createEnrollment = useCreateEnrollment();

  const promoteFromWaitlist = async (studentId: string) => {
    if (!selectedOffering) return;
    
    try {
      await createEnrollment.mutateAsync({
        user_id: studentId,
        course_offering_id: selectedOffering,
        status: 'ENROLLED'
      });
    } catch (error) {
      console.error('Failed to promote from waitlist:', error);
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
                        <span>{offering.courses?.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {offering.locations?.name} - {new Date(offering.start_date).toLocaleDateString()}
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
                <Badge variant="secondary">
                  {waitlistedStudents.length} students waiting
                </Badge>
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
                          <p className="font-medium">{student.profiles?.display_name}</p>
                          <p className="text-sm text-muted-foreground">{student.profiles?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Position #{student.waitlist_position}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => promoteFromWaitlist(student.user_id)}
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
    </div>
  );
}
