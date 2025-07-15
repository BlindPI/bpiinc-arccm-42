import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, Calendar, Clock, CheckCircle, XCircle, 
  AlertCircle, FileText, Award, UserCheck, UserX,
  Search, Filter, Download, Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface StudentRosterMember {
  id: string;
  roster_id: string;
  student_id?: string;
  student_profile_id?: string;
  enrollment_status: string;
  completion_status: string;
  attendance_status?: string;
  created_at: string;
  updated_at?: string;
  enrolled_at?: string;
  enrolled_by?: string;
  completion_date?: string;
  assessed_by?: string;
  pass_status?: string;
  student_enrollment_profiles?: {
    display_name: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

interface RosterWithStudents {
  id: string;
  roster_name?: string;
  course_name?: string;
  course_id?: string;
  location_id?: string;
  status?: string;
  created_at: string;
  availability_booking_id?: string;
  student_roster_members?: StudentRosterMember[];
  courses?: {
    name: string;
    description?: string;
  };
  locations?: {
    name: string;
    city?: string;
    state_province?: string;
  };
}

interface RosterManagementProps {
  instructorId: string;
  teamId?: string;
  showTeamRostersOnly?: boolean;
}

export function RosterManagement({ instructorId, teamId, showTeamRostersOnly = false }: RosterManagementProps) {
  const { user } = useAuth();
  const [rosters, setRosters] = useState<RosterWithStudents[]>([]);
  const [selectedRoster, setSelectedRoster] = useState<RosterWithStudents | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRosters();
  }, [instructorId, teamId, showTeamRostersOnly]);

  const loadRosters = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('student_rosters')
        .select(`
          *,
          student_roster_members (
            *,
            student_enrollment_profiles (
              display_name,
              email,
              first_name,
              last_name
            )
          ),
          courses (
            name,
            description
          ),
          locations (
            name,
            city,
            state_province
          )
        `);

      // Filter by team or instructor
      if (showTeamRostersOnly && teamId) {
        // Get rosters assigned to team location
        const { data: teamData } = await supabase
          .from('teams')
          .select('location_id')
          .eq('id', teamId)
          .single();
        
        if (teamData?.location_id) {
          query = query.eq('location_id', teamData.location_id);
        }
      } else {
        // Get rosters assigned to specific instructor via availability bookings
        const { data: instructorBookings } = await supabase
          .from('availability_bookings')
          .select('id')
          .eq('user_id', instructorId);
        
        if (instructorBookings?.length) {
          const bookingIds = instructorBookings.map(b => b.id);
          query = query.in('availability_booking_id', bookingIds);
        } else {
          // No bookings found, return empty
          setRosters([]);
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setRosters((data as any) || []);
    } catch (error) {
      console.error('Error loading rosters:', error);
      toast.error('Failed to load rosters');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAttendance = async (memberId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    try {
      const { error } = await supabase
        .from('student_roster_members')
        .update({
          attendance_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
      
      toast.success(`Attendance marked as ${status}`);
      await loadRosters();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const updateCompletionStatus = async (memberId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('student_roster_members')
        .update({
          completion_status: status,
          enrollment_status: status === 'completed' ? 'completed' : 'enrolled',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
      
      toast.success(`Student status updated to ${status.replace('_', ' ')}`);
      await loadRosters();
    } catch (error) {
      console.error('Error updating completion status:', error);
      toast.error('Failed to update student status');
    }
  };

  const submitRosterForReview = async (rosterId: string) => {
    try {
      // Update roster status to indicate it's ready for review
      const { error } = await supabase
        .from('student_rosters')
        .update({ 
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', rosterId);

      if (error) throw error;

      toast.success('Roster submitted for review. Certificates can now be requested.');
      await loadRosters();
    } catch (error) {
      console.error('Error submitting roster:', error);
      toast.error('Failed to submit roster for review');
    }
  };

  const getAttendanceBadge = (status?: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Late</Badge>;
      case 'excused':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Excused</Badge>;
      default:
        return <Badge variant="outline">Not Recorded</Badge>;
    }
  };

  const getCompletionBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">In Progress</Badge>;
      case 'not_started':
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const filteredRosters = rosters.filter(roster =>
    roster.roster_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roster.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roster.courses?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Loading Rosters...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {showTeamRostersOnly ? 'Team Student Rosters' : 'My Student Rosters'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search rosters by name or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Roster List */}
          {filteredRosters.length > 0 ? (
            <div className="space-y-4">
              {filteredRosters.map((roster) => (
                <Card key={roster.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedRoster(roster)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{roster.roster_name}</h3>
                        <div className="text-sm text-muted-foreground">
                          <p>Course: {roster.courses?.name || 'No course assigned'}</p>
                          <p>Location: {roster.locations?.name || 'No location'}</p>
                          <p>Students: {roster.student_roster_members?.length || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{roster.status}</Badge>
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                          {roster.student_roster_members?.filter(m => m.completion_status === 'completed').length || 0} Completed
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                {searchTerm ? 'No rosters match your search criteria.' : 'No student rosters assigned.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Selected Roster Details */}
      {selectedRoster && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedRoster.roster_name} - Student Management
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => submitRosterForReview(selectedRoster.id)}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Submit for Certificates
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedRoster(null)}>
                  Close
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedRoster.student_roster_members?.map((member) => (
                <div key={member.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {member.student_enrollment_profiles?.display_name || 
                         `${member.student_enrollment_profiles?.first_name} ${member.student_enrollment_profiles?.last_name}`.trim() ||
                         'Unknown Student'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {member.student_enrollment_profiles?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAttendanceBadge(member.attendance_status)}
                      {getCompletionBadge(member.completion_status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Attendance Control */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mark Attendance</label>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={member.attendance_status === 'present' ? 'default' : 'outline'}
                          onClick={() => updateAttendance(member.id, 'present')}
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={member.attendance_status === 'absent' ? 'destructive' : 'outline'}
                          onClick={() => updateAttendance(member.id, 'absent')}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={member.attendance_status === 'late' ? 'secondary' : 'outline'}
                          onClick={() => updateAttendance(member.id, 'late')}
                        >
                          Late
                        </Button>
                        <Button
                          size="sm"
                          variant={member.attendance_status === 'excused' ? 'secondary' : 'outline'}
                          onClick={() => updateAttendance(member.id, 'excused')}
                        >
                          Excused
                        </Button>
                      </div>
                    </div>

                    {/* Completion Status Control */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Update Progress</label>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={member.completion_status === 'not_started' ? 'outline' : 'ghost'}
                          onClick={() => updateCompletionStatus(member.id, 'not_started')}
                        >
                          Not Started
                        </Button>
                        <Button
                          size="sm"
                          variant={member.completion_status === 'in_progress' ? 'secondary' : 'outline'}
                          onClick={() => updateCompletionStatus(member.id, 'in_progress')}
                        >
                          In Progress
                        </Button>
                        <Button
                          size="sm"
                          variant={member.completion_status === 'completed' ? 'default' : 'outline'}
                          onClick={() => updateCompletionStatus(member.id, 'completed')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}