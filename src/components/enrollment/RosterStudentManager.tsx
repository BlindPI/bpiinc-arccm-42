import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, UserMinus, Mail, User, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface RosterStudentManagerProps {
  rosterId: string;
  rosterName: string;
  maxCapacity: number;
  currentEnrollment: number;
}

interface StudentProfile {
  id: string;
  display_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface RosterMember {
  id: string;
  enrollment_status: string;
  enrolled_at: string;
  student_enrollment_profiles: StudentProfile;
}

export function RosterStudentManager({ 
  rosterId, 
  rosterName, 
  maxCapacity, 
  currentEnrollment 
}: RosterStudentManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const queryClient = useQueryClient();

  // Get roster members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['roster-members', rosterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_roster_members')
        .select(`
          id, enrollment_status, enrolled_at,
          student_enrollment_profiles(
            id, display_name, email, first_name, last_name
          )
        `)
        .eq('roster_id', rosterId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data as RosterMember[];
    }
  });

  // Search for existing students
  const { data: searchResults = [] } = useQuery({
    queryKey: ['student-search', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      
      const { data, error } = await supabase
        .from('student_enrollment_profiles')
        .select('id, display_name, email, first_name, last_name')
        .or(`email.ilike.%${searchEmail}%,display_name.ilike.%${searchEmail}%`)
        .limit(10);

      if (error) throw error;
      return data as StudentProfile[];
    },
    enabled: searchEmail.length >= 3
  });

  // Add existing student to roster
  const addExistingStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { data, error } = await supabase
        .from('student_roster_members')
        .insert({
          roster_id: rosterId,
          student_profile_id: studentId,
          enrollment_status: 'enrolled',
          enrolled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Student added to roster');
      queryClient.invalidateQueries({ queryKey: ['roster-members', rosterId] });
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
      setSearchEmail('');
    },
    onError: (error: any) => {
      toast.error(`Failed to add student: ${error.message}`);
    }
  });

  // Create new student and add to roster
  const addNewStudent = useMutation({
    mutationFn: async () => {
      // First create the student profile
      const { data: profile, error: profileError } = await supabase
        .from('student_enrollment_profiles')
        .insert({
          email: newStudentEmail,
          first_name: newStudentFirstName,
          last_name: newStudentLastName,
          display_name: `${newStudentFirstName} ${newStudentLastName}`.trim() || newStudentEmail
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Then add them to the roster
      const { data, error } = await supabase
        .from('student_roster_members')
        .insert({
          roster_id: rosterId,
          student_profile_id: profile.id,
          enrollment_status: 'enrolled',
          enrolled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('New student created and added to roster');
      queryClient.invalidateQueries({ queryKey: ['roster-members', rosterId] });
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
      setNewStudentEmail('');
      setNewStudentFirstName('');
      setNewStudentLastName('');
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create student: ${error.message}`);
    }
  });

  // Remove student from roster
  const removeStudent = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('student_roster_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Student removed from roster');
      queryClient.invalidateQueries({ queryKey: ['roster-members', rosterId] });
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove student: ${error.message}`);
    }
  });

  const availableSpots = maxCapacity - currentEnrollment;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students in {rosterName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {currentEnrollment}/{maxCapacity} enrolled
            </Badge>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={availableSpots <= 0}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Student to Roster</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Search existing students */}
                  <div className="space-y-2">
                    <Label>Search Existing Students</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email or name..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <ScrollArea className="h-32 border rounded p-2">
                        <div className="space-y-1">
                          {searchResults.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                              <div>
                                <p className="text-sm font-medium">{student.display_name}</p>
                                <p className="text-xs text-muted-foreground">{student.email}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addExistingStudent.mutate(student.id)}
                                disabled={addExistingStudent.isPending}
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  <div className="text-center text-sm text-muted-foreground">or</div>

                  {/* Create new student */}
                  <div className="space-y-3">
                    <Label>Create New Student</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          value={newStudentFirstName}
                          onChange={(e) => setNewStudentFirstName(e.target.value)}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          value={newStudentLastName}
                          onChange={(e) => setNewStudentLastName(e.target.value)}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStudentEmail}
                        onChange={(e) => setNewStudentEmail(e.target.value)}
                        placeholder="student@example.com"
                      />
                    </div>
                    <Button
                      onClick={() => addNewStudent.mutate()}
                      disabled={!newStudentEmail || addNewStudent.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create & Add Student
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No students enrolled yet</p>
            <p className="text-xs">Add students to this roster</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {member.student_enrollment_profiles.display_name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.student_enrollment_profiles.display_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.student_enrollment_profiles.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {member.enrollment_status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStudent.mutate(member.id)}
                      disabled={removeStudent.isPending}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}