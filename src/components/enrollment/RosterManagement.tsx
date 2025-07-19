import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Download,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  TrendingUp
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RosterBuilder } from './RosterBuilder';
import { RosterTable } from './RosterTable';
import { RosterExportDialog } from './RosterExportDialog';
import { RosterStudentManager } from './RosterStudentManager';
import { RosterBookingAssignment } from './RosterBookingAssignment';
import { StudentCourseAssignment } from './StudentCourseAssignment';
import { CapacityStatusBadge, CapacityIndicator } from './capacity';
import { useRosterCapacityValidation } from '@/hooks/useRosterCapacityValidation';

interface StudentRoster {
  id: string;
  roster_name: string;
  course_name: string;
  location_id: string;
  instructor_id: string;
  max_capacity: number;
  current_enrollment: number;
  roster_status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  roster_type: 'TRAINING' | 'CERTIFICATE';
  scheduled_start_date?: string;
  scheduled_end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  locations?: {
    name: string;
    city: string;
    state: string;
  };
  profiles?: {
    display_name: string;
  };
}

export function RosterManagement() {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'manage' | 'edit' | 'assign-courses' | 'assign-booking'>('list');
  const [selectedRoster, setSelectedRoster] = useState<StudentRoster | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('TRAINING');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all rosters with type filtering and booking information
  const { data: rosters = [], isLoading } = useQuery({
    queryKey: ['student-rosters', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('student_rosters')
        .select(`
          *,
          locations(name, city, state),
          profiles!student_rosters_instructor_id_fkey(display_name),
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
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('roster_status', statusFilter);
      }

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('roster_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (StudentRoster & {
        availability_bookings?: {
          id: string;
          title: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          user_id: string;
          profiles?: { display_name: string };
        };
      })[];
    }
  });

  // Update roster status mutation
  const updateRosterStatusMutation = useMutation({
    mutationFn: async ({ rosterId, status }: { rosterId: string; status: string }) => {
      const { error } = await supabase
        .from('student_rosters')
        .update({ roster_status: status })
        .eq('id', rosterId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Roster status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
      setActiveView('list');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update roster: ${error.message}`);
    }
  });

  // Delete roster mutation
  const deleteRosterMutation = useMutation({
    mutationFn: async (rosterId: string) => {
      const { error } = await supabase
        .from('student_rosters')
        .delete()
        .eq('id', rosterId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Roster deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete roster: ${error.message}`);
    }
  });

  // Enhanced export roster mutation
  const exportRosterMutation = useMutation({
    mutationFn: async (rosterId: string) => {
      setSelectedRoster(rosters.find(r => r.id === rosterId) || null);
      setShowExportDialog(true);
    },
    onError: (error: Error) => {
      toast.error(`Failed to open export dialog: ${error.message}`);
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'COMPLETED': return 'secondary';
      case 'DRAFT': return 'outline';
      case 'ARCHIVED': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'DRAFT': return <Edit className="h-4 w-4" />;
      case 'ARCHIVED': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Enhanced roster card component with capacity integration
  const RosterCardWithCapacity = ({ roster }: { roster: StudentRoster & {
    availability_bookings?: {
      id: string;
      title: string;
      booking_date: string;
      start_time: string;
      end_time: string;
      user_id: string;
      profiles?: { display_name: string };
    };
  } }) => {
    const { capacityStatusType, isNearlyFull, isFull, isOverCapacity } = useRosterCapacityValidation({
      rosterId: roster.id,
      includeWaitlist: false
    });

    return (
      <Card key={roster.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{roster.roster_name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(roster.roster_status)} className="text-xs">
                  {getStatusIcon(roster.roster_status)}
                  <span className="ml-1">{roster.roster_status}</span>
                </Badge>
                {/* Enhanced capacity status badge */}
                <CapacityStatusBadge
                  status={capacityStatusType}
                  capacityInfo={{
                    success: true,
                    roster_id: roster.id,
                    roster_name: roster.roster_name,
                    max_capacity: roster.max_capacity,
                    current_enrollment: roster.current_enrollment,
                    available_spots: roster.max_capacity ? roster.max_capacity - roster.current_enrollment : null,
                    can_enroll: roster.max_capacity ? roster.current_enrollment < roster.max_capacity : true,
                    requested_students: 0
                  }}
                  showSpots={true}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mr-2" />
              {roster.course_name}
            </div>
            {roster.locations && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                {roster.locations.name}, {roster.locations.city}
              </div>
            )}
            {roster.profiles && (
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                {roster.profiles.display_name}
              </div>
            )}
            {roster.scheduled_start_date && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(roster.scheduled_start_date).toLocaleDateString()}
              </div>
            )}
            
            {/* Booking Assignment Status */}
            {roster.availability_bookings ? (
              <div className="flex items-start text-sm text-green-700 bg-green-50 p-2 rounded">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="font-medium">Assigned to: {roster.availability_bookings.title}</div>
                  <div className="text-xs text-green-600">
                    {new Date(roster.availability_bookings.booking_date).toLocaleDateString()} at {roster.availability_bookings.start_time} - {roster.availability_bookings.end_time}
                  </div>
                  {roster.availability_bookings.profiles && (
                    <div className="text-xs text-green-600">
                      Instructor: {roster.availability_bookings.profiles.display_name}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center text-sm text-amber-700 bg-amber-50 p-2 rounded">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Not assigned to any booking</span>
              </div>
            )}

            {/* Capacity warnings */}
            {(isNearlyFull || isFull || isOverCapacity) && (
              <div className={`flex items-center text-sm p-2 rounded ${
                isOverCapacity ? 'text-red-700 bg-red-50' :
                isFull ? 'text-orange-700 bg-orange-50' :
                'text-yellow-700 bg-yellow-50'
              }`}>
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>
                  {isOverCapacity ? 'Over capacity - requires attention' :
                   isFull ? 'At full capacity' :
                   'Nearly full - monitor closely'}
                </span>
              </div>
            )}
          </div>

          {/* Enhanced enrollment progress with capacity integration */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Enrollment</span>
              <span>{roster.current_enrollment} / {roster.max_capacity || '∞'}</span>
            </div>
            <CapacityIndicator rosterId={roster.id} />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRoster(roster);
                  setActiveView('manage');
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Manage Students
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRoster(roster);
                  setActiveView('assign-courses');
                }}
              >
                <FileText className="h-4 w-4 mr-1" />
                Assign Courses
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={roster.availability_bookings ? "secondary" : "default"}
                size="sm"
                onClick={() => {
                  setSelectedRoster(roster);
                  setActiveView('assign-booking');
                }}
              >
                <Calendar className="h-4 w-4 mr-1" />
                {roster.availability_bookings ? 'Reassign Booking' : 'Assign to Booking'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRoster(roster);
                  setActiveView('edit');
                }}
              >
                <Settings className="h-4 w-4 mr-1" />
                Edit Status
              </Button>
            </div>
            <div className="flex gap-2">
              <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRoster(roster);
                      setShowExportDialog(true);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  {selectedRoster && (
                    <RosterExportDialog
                      roster={selectedRoster}
                      onClose={() => setShowExportDialog(false)}
                    />
                  )}
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteRosterMutation.mutate(roster.id)}
                disabled={deleteRosterMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (activeView === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create New Training Roster</h2>
          <p className="text-muted-foreground">Create a student roster that can be assigned to scheduled courses</p>
        </div>
          <Button variant="outline" onClick={() => setActiveView('list')}>
            Back to Rosters
          </Button>
        </div>
        <RosterBuilder onComplete={() => setActiveView('list')} />
      </div>
    );
  }

  if (activeView === 'manage' && selectedRoster) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Manage Roster: {selectedRoster.roster_name}</h2>
            <p className="text-muted-foreground">Add, remove, and manage students in this roster</p>
          </div>
          <Button variant="outline" onClick={() => setActiveView('list')}>
            Back to Rosters
          </Button>
        </div>
        <RosterStudentManager
          rosterId={selectedRoster.id}
          rosterName={selectedRoster.roster_name}
          maxCapacity={selectedRoster.max_capacity}
          currentEnrollment={selectedRoster.current_enrollment}
        />
      </div>
    );
  }

  if (activeView === 'assign-courses' && selectedRoster) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Assign Courses: {selectedRoster.roster_name}</h2>
            <p className="text-muted-foreground">Assign individual courses to students in this roster</p>
          </div>
          <Button variant="outline" onClick={() => setActiveView('list')}>
            Back to Rosters
          </Button>
        </div>
        <StudentCourseAssignment rosterId={selectedRoster.id} />
      </div>
    );
  }

  if (activeView === 'assign-booking' && selectedRoster) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Assign to Booking: {selectedRoster.roster_name}</h2>
            <p className="text-muted-foreground">Assign this roster to an availability booking for scheduling</p>
          </div>
          <Button variant="outline" onClick={() => setActiveView('list')}>
            Back to Rosters
          </Button>
        </div>
        <RosterBookingAssignment 
          rosterId={selectedRoster.id} 
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
            setActiveView('list');
          }}
        />
      </div>
    );
  }

  if (activeView === 'edit' && selectedRoster) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Edit Roster: {selectedRoster.roster_name}</h2>
            <p className="text-muted-foreground">Update roster status and properties</p>
          </div>
          <Button variant="outline" onClick={() => setActiveView('list')}>
            Back to Rosters
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Roster Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label>Current Status: <Badge variant={getStatusBadgeVariant(selectedRoster.roster_status)}>{selectedRoster.roster_status}</Badge></Label>
              </div>
              <div className="flex gap-2">
                {selectedRoster.roster_status === 'DRAFT' && (
                  <Button 
                    onClick={() => updateRosterStatusMutation.mutate({ rosterId: selectedRoster.id, status: 'ACTIVE' })}
                    disabled={updateRosterStatusMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate Roster
                  </Button>
                )}
                {selectedRoster.roster_status === 'ACTIVE' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => updateRosterStatusMutation.mutate({ rosterId: selectedRoster.id, status: 'COMPLETED' })}
                      disabled={updateRosterStatusMutation.isPending}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Mark Completed
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => updateRosterStatusMutation.mutate({ rosterId: selectedRoster.id, status: 'ARCHIVED' })}
                      disabled={updateRosterStatusMutation.isPending}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roster Management</h2>
          <p className="text-muted-foreground">Create training rosters that can be assigned to scheduled courses</p>
        </div>
        <Button onClick={() => setActiveView('create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Roster
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="type-filter">Roster Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRAINING">Training Rosters</SelectItem>
                  <SelectItem value="CERTIFICATE">Certificate Rosters</SelectItem>
                  <SelectItem value="all">All Types</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rosters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rosters Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first roster to start managing course enrollments.
            </p>
            <Button onClick={() => setActiveView('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Roster
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rosters.map((roster) => (
            <Card key={roster.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{roster.roster_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(roster.roster_status)} className="text-xs">
                        {getStatusIcon(roster.roster_status)}
                        <span className="ml-1">{roster.roster_status}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    {roster.course_name}
                  </div>
                  {roster.locations && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {roster.locations.name}, {roster.locations.city}
                    </div>
                  )}
                  {roster.profiles && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      {roster.profiles.display_name}
                    </div>
                  )}
                  {roster.scheduled_start_date && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(roster.scheduled_start_date).toLocaleDateString()}
                    </div>
                  )}
                  
                  {/* Booking Assignment Status */}
                  {roster.availability_bookings ? (
                    <div className="flex items-start text-sm text-green-700 bg-green-50 p-2 rounded">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <div className="font-medium">Assigned to: {roster.availability_bookings.title}</div>
                        <div className="text-xs text-green-600">
                          {new Date(roster.availability_bookings.booking_date).toLocaleDateString()} at {roster.availability_bookings.start_time} - {roster.availability_bookings.end_time}
                        </div>
                        {roster.availability_bookings.profiles && (
                          <div className="text-xs text-green-600">
                            Instructor: {roster.availability_bookings.profiles.display_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-amber-700 bg-amber-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>Not assigned to any booking</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enrollment</span>
                    <span>{roster.current_enrollment} / {roster.max_capacity}</span>
                  </div>
                  <Progress 
                    value={(roster.current_enrollment / roster.max_capacity) * 100} 
                    className="h-2"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRoster(roster);
                        setActiveView('manage');
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Manage Students
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRoster(roster);
                        setActiveView('assign-courses');
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Assign Courses
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={roster.availability_bookings ? "secondary" : "default"}
                      size="sm"
                      onClick={() => {
                        setSelectedRoster(roster);
                        setActiveView('assign-booking');
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {roster.availability_bookings ? 'Reassign Booking' : 'Assign to Booking'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRoster(roster);
                        setActiveView('edit');
                      }}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit Status
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRoster(roster);
                            setShowExportDialog(true);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        {selectedRoster && (
                          <RosterExportDialog 
                            roster={selectedRoster} 
                            onClose={() => setShowExportDialog(false)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRosterMutation.mutate(roster.id)}
                      disabled={deleteRosterMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}