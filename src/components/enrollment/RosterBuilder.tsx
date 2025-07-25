import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Search, 
  Filter,
  MapPin,
  User,
  FileText,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  province: string;
  postal_code: string;
  first_aid_level: string;
  cpr_level: string;
  completion_status: string;
  assessment_status: string;
  instructor_name: string;
  location_id: string;
}

interface RosterFormData {
  roster_name: string;
  description: string;
  location_id: string;
  instructor_id: string;
  max_capacity: number;
}

interface RosterBuilderProps {
  onComplete: () => void;
}

export function RosterBuilder({ onComplete }: RosterBuilderProps) {
  const [formData, setFormData] = useState<RosterFormData>({
    roster_name: '',
    description: '',
    location_id: '',
    instructor_id: '',
    max_capacity: 20
  });
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const queryClient = useQueryClient();

  // Fetch student profiles with improved filtering
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['student-enrollment-profiles', searchTerm, statusFilter, locationFilter],
    queryFn: async () => {
      let query = supabase
        .from('student_enrollment_profiles')
        .select('*')
        .eq('is_active', true)
        .order('last_name');

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('completion_status', statusFilter);
      }

      // Filter by location if selected and students have location data
      if (locationFilter && locationFilter !== 'all') {
        query = query.eq('location_id', locationFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StudentProfile[];
    }
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, state')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch instructors filtered by location if selected
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors', formData.location_id],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, display_name, role, location_id')
        .in('role', ['IC', 'IP', 'IT'])
        .order('display_name');

      // Filter instructors by location if location is selected
      if (formData.location_id) {
        query = query.eq('location_id', formData.location_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Create roster mutation - simplified for TRAINING rosters
  const createRosterMutation = useMutation({
    mutationFn: async () => {
      if (!formData.roster_name.trim()) {
        throw new Error('Roster name is required');
      }

      if (selectedStudents.length === 0) {
        throw new Error('Please select at least one student');
      }

      // Create the TRAINING roster - ready to be assigned to scheduled courses
      const { data: roster, error: rosterError } = await supabase
        .from('student_rosters')
        .insert([{
          roster_name: formData.roster_name,
          course_name: 'Training Roster', // Generic name - will be updated when assigned to course
          location_id: formData.location_id || null,
          instructor_id: formData.instructor_id || null,
          max_capacity: formData.max_capacity,
          // Remove manual current_enrollment - let trigger handle it
          roster_status: 'DRAFT', // Start as DRAFT until assigned to a course
          roster_type: 'TRAINING',
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select('id')
        .single();

      if (rosterError) throw rosterError;

      // Add students to roster - FIXED: Insert into correct table with proper schema
      const enrollmentData = selectedStudents.map(studentId => ({
        roster_id: roster.id,
        student_profile_id: studentId,
        enrolled_at: new Date().toISOString(),
        enrollment_status: 'ENROLLED'
      }));

      const { error: enrollmentError } = await supabase
        .from('student_roster_members')
        .insert(enrollmentData);

      if (enrollmentError) throw enrollmentError;

      return roster;
    },
    onSuccess: (roster) => {
      toast.success(`Training roster "${formData.roster_name}" created successfully with ${selectedStudents.length} students. It can now be assigned to scheduled courses.`);
      queryClient.invalidateQueries({ queryKey: ['student-rosters'] });
      onComplete();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create roster: ${error.message}`);
    }
  });

  const filteredStudents = students.filter(student => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        student.first_name?.toLowerCase().includes(search) ||
        student.last_name?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllFiltered = () => {
    const allIds = filteredStudents.map(s => s.id);
    setSelectedStudents(prev => {
      const newSelection = [...new Set([...prev, ...allIds])];
      return newSelection;
    });
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const updateFormData = (field: keyof RosterFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-set location filter when location is selected for better student filtering
  React.useEffect(() => {
    if (formData.location_id && formData.location_id !== locationFilter) {
      setLocationFilter(formData.location_id);
    }
  }, [formData.location_id, locationFilter]);

  const validateForm = (): boolean => {
    if (!formData.roster_name.trim()) {
      toast.error('Roster name is required');
      return false;
    }
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return false;
    }
    if (selectedStudents.length > formData.max_capacity) {
      toast.error(`Cannot select more than ${formData.max_capacity} students`);
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createRosterMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Roster Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Roster Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roster_name">Roster Name *</Label>
                <Input
                  id="roster_name"
                  value={formData.roster_name}
                  onChange={(e) => updateFormData('roster_name', e.target.value)}
                  placeholder="Enter roster name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Brief description of this training roster"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location_id">Location</Label>
                <Select value={formData.location_id} onValueChange={(value) => updateFormData('location_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex flex-col">
                          <span>{location.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {location.city}, {location.state}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor_id">Instructor</Label>
                <Select value={formData.instructor_id} onValueChange={(value) => updateFormData('instructor_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        <div className="flex flex-col">
                          <span>{instructor.display_name}</span>
                          <span className="text-xs text-muted-foreground">{instructor.role}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_capacity">Maximum Capacity</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  value={formData.max_capacity}
                  onChange={(e) => updateFormData('max_capacity', parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Training rosters can be assigned to scheduled courses after creation</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Students ({selectedStudents.length} / {formData.max_capacity})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>

            {/* Student List */}
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {studentsLoading ? (
                <div className="p-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                          disabled={
                            !selectedStudents.includes(student.id) && 
                            selectedStudents.length >= formData.max_capacity
                          }
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {student.first_name} {student.last_name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {student.completion_status}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {student.assessment_status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>{student.email}</div>
                            {student.phone && <div>{student.phone}</div>}
                            {student.company && <div>{student.company}</div>}
                            <div className="flex items-center gap-4">
                              {student.city && student.province && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {student.city}, {student.province}
                                </span>
                              )}
                              {student.instructor_name && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {student.instructor_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedStudents.length > formData.max_capacity && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  You have selected {selectedStudents.length} students, but the maximum capacity is {formData.max_capacity}.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createRosterMutation.isPending || selectedStudents.length === 0}
          >
            {createRosterMutation.isPending ? 'Creating...' : 'Create Roster'}
          </Button>
        </div>
      </form>
    </div>
  );
}