import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, Clock, Plus, Edit, Trash2, Users, 
  BookOpen, CheckCircle, XCircle, AlertTriangle,
  MapPin, Phone, Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AvailabilityBooking {
  id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  booking_type: 'course_instruction' | 'training_session' | 'meeting' | 'administrative' | 'personal';
  title: string;
  description?: string;
  status: string;
  course_id?: string;
  roster_id?: string;
  student_count?: number;
  created_at: string;
  updated_at: string;
  approval_date?: string;
  approved_by?: string;
  billable_hours?: number;
  hours_credited?: number;
  bulk_operation_id?: string;
  requires_approval?: boolean;
  team_id?: string;
  course_offering_id?: string;
  course_sequence?: any;
  created_by?: string;
  student_rosters?: Array<{
    id: string;
    roster_name: string;
    status?: string;
    student_roster_members: Array<{
      id: string;
      enrollment_status?: string;
      completion_status?: string;
      attendance_status?: string;
      student_enrollment_profiles: {
        display_name: string;
        email: string;
        first_name?: string;
        last_name?: string;
      };
    }>;
  }>;
  courses?: {
    name: string;
    description?: string;
  };
}

interface AvailabilityManagementProps {
  userId: string;
  showTeamBookings?: boolean;
  teamId?: string;
}

export function AvailabilityManagement({ userId, showTeamBookings = false, teamId }: AvailabilityManagementProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<AvailabilityBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<AvailabilityBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    booking_date: '',
    start_time: '',
    end_time: '',
    booking_type: 'administrative' as const,
    title: '',
    description: ''
  });

  useEffect(() => {
    loadBookings();
  }, [userId, showTeamBookings, teamId]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('availability_bookings')
        .select(`
          *,
          student_rosters!student_rosters_availability_booking_id_fkey (
            id,
            roster_name,
            status,
            course_id,
            student_roster_members (
              id,
              enrollment_status,
              completion_status,
              attendance_status,
              student_enrollment_profiles (
                display_name,
                email,
                first_name,
                last_name
              )
            )
          ),
          courses (
            name,
            description
          )
        `)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (showTeamBookings && teamId) {
        // Get team members and their bookings
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', teamId)
          .eq('status', 'active');

        if (teamMembers?.length) {
          const userIds = teamMembers.map(m => m.user_id);
          query = query.in('user_id', userIds);
        }
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings((data as any) || []);
    } catch (error) {
      console.error('Error loading availability bookings:', error);
      toast.error('Failed to load availability data');
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('availability_bookings')
        .insert({
          user_id: userId,
          ...formData,
          status: 'scheduled'
        });

      if (error) throw error;

      toast.success('Availability booking created');
      setShowAddForm(false);
      setFormData({
        booking_date: '',
        start_time: '',
        end_time: '',
        booking_type: 'administrative',
        title: '',
        description: ''
      });
      await loadBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress') => {
    try {
      const { error } = await supabase
        .from('availability_bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking status updated to ${status}`);
      await loadBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const updateStudentAttendance = async (memberId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
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
      await loadBookings();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const markStudentCompleted = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('student_roster_members')
        .update({
          completion_status: 'completed',
          enrollment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
      
      toast.success('Student marked as completed');
      await loadBookings();
    } catch (error) {
      console.error('Error updating completion status:', error);
      toast.error('Failed to update completion status');
    }
  };

  const submitForCertificates = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking?.student_rosters?.[0]) return;

    try {
      // Update roster status to completed for certificate processing
      const { error } = await supabase
        .from('student_rosters')
        .update({ 
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.student_rosters[0].id);

      if (error) throw error;

      toast.success('Session submitted for certificate processing');
      await loadBookings();
    } catch (error) {
      console.error('Error submitting for certificates:', error);
      toast.error('Failed to submit for certificates');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">In Progress</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'scheduled':
      default:
        return <Badge variant="outline">Scheduled</Badge>;
    }
  };

  const getBookingTypeBadge = (type: string) => {
    switch (type) {
      case 'course_instruction':
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Course Instruction</Badge>;
      case 'training_session':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Training Session</Badge>;
      case 'meeting':
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Meeting</Badge>;
      case 'personal':
        return <Badge variant="destructive">Personal</Badge>;
      case 'administrative':
      default:
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Administrative</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Loading Schedule...
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

  const upcomingBookings = bookings.filter(b => 
    new Date(b.booking_date) >= new Date() && b.status !== 'cancelled'
  );

  const pastBookings = bookings.filter(b => 
    new Date(b.booking_date) < new Date() || b.status === 'completed'
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {showTeamBookings ? 'Team Schedule' : 'My Schedule & Availability'}
            </span>
            {!showTeamBookings && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Availability
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Availability Form */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Add New Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={formData.booking_date}
                      onChange={(e) => setFormData({...formData, booking_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Start Time</label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Time</label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.booking_type}
                      onChange={(e) => setFormData({...formData, booking_type: e.target.value as any})}
                    >
                      <option value="administrative">Administrative</option>
                      <option value="course_instruction">Course Instruction</option>
                      <option value="training_session">Training Session</option>
                      <option value="meeting">Meeting</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="e.g., Available for Teaching"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    placeholder="Additional details..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createBooking} disabled={!formData.booking_date || !formData.start_time || !formData.end_time || !formData.title}>
                    Create Booking
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Bookings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upcoming Schedule</h3>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedBooking(booking)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{booking.title}</h4>
                            {getBookingTypeBadge(booking.booking_type)}
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(booking.booking_date).toLocaleDateString()}
                              <Clock className="h-3 w-3 ml-2" />
                              {booking.start_time} - {booking.end_time}
                            </p>
                            {booking.description && <p className="mt-1">{booking.description}</p>}
                            {booking.student_rosters?.[0] && (
                              <p className="flex items-center gap-1 mt-1">
                                <Users className="h-3 w-3" />
                                {booking.student_rosters[0].roster_name} ({booking.student_rosters[0].student_roster_members?.length || 0} students)
                              </p>
                            )}
                          </div>
                        </div>
                        {booking.booking_type === 'course_instruction' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={booking.status === 'in_progress' ? 'default' : 'outline'}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBookingStatus(booking.id, booking.status === 'in_progress' ? 'scheduled' : 'in_progress');
                              }}
                            >
                              {booking.status === 'in_progress' ? 'End Session' : 'Start Session'}
                            </Button>
                            <Button
                              size="sm"
                              variant={booking.status === 'completed' ? 'default' : 'outline'}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBookingStatus(booking.id, 'completed');
                              }}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  No upcoming bookings. {!showTeamBookings && 'Add your availability above to get started.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Booking Details */}
      {selectedBooking && selectedBooking.booking_type === 'course_instruction' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Session Details
              </span>
              <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Session Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Title:</strong> {selectedBooking.title}</p>
                    <p><strong>Date:</strong> {new Date(selectedBooking.booking_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {selectedBooking.start_time} - {selectedBooking.end_time}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedBooking.status)}</p>
                    {selectedBooking.courses && (
                      <p><strong>Course:</strong> {selectedBooking.courses.name}</p>
                    )}
                  </div>
                </div>
                
                {selectedBooking.student_rosters?.[0] && (
                  <div>
                    <h4 className="font-semibold mb-2">Students ({selectedBooking.student_rosters[0].student_roster_members?.length || 0})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedBooking.student_rosters[0].student_roster_members?.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {member.student_enrollment_profiles?.display_name || 
                               `${member.student_enrollment_profiles?.first_name} ${member.student_enrollment_profiles?.last_name}`.trim() ||
                               'Unknown Student'}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.student_enrollment_profiles?.email}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant={member.completion_status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                {member.completion_status === 'completed' ? 'Completed' : 
                                 member.completion_status === 'in_progress' ? 'In Progress' : 'Not Started'}
                              </Badge>
                              {member.attendance_status && (
                                <Badge variant={member.attendance_status === 'present' ? 'default' : 'destructive'} className="text-xs">
                                  {member.attendance_status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant={member.attendance_status === 'present' ? 'default' : 'outline'}
                              onClick={() => updateStudentAttendance(member.id, 'present')}
                            >
                              Present
                            </Button>
                            <Button 
                              size="sm" 
                              variant={member.attendance_status === 'absent' ? 'destructive' : 'outline'}
                              onClick={() => updateStudentAttendance(member.id, 'absent')}
                            >
                              Absent
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Session Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'in_progress')}
                  disabled={selectedBooking.status === 'in_progress'}
                >
                  Start Session
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                  disabled={selectedBooking.status === 'completed'}
                >
                  Mark Complete
                </Button>
                {selectedBooking.status === 'completed' && selectedBooking.student_rosters?.[0] && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => submitForCertificates(selectedBooking.id)}
                    disabled={selectedBooking.student_rosters[0].status === 'COMPLETED'}
                  >
                    Submit for Certificates
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                  disabled={selectedBooking.status === 'cancelled'}
                >
                  Cancel Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}