import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRosterStudents, useUpdateStudentAssessment, useBulkUpdateAttendance } from '@/hooks/useInstructorCourses';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, CheckCircle, Save, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StudentData {
  id: string;
  attendance_status: string;
  practical_score: number | null;
  written_score: number | null;
  completion_status: string;
  completion_date: string | null;
  notes: string | null;
  student_enrollment_profiles: {
    display_name: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
}

export default function InstructorRosterDetail() {
  const { rosterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const course = location.state?.course;
  
  const { data: students, isLoading } = useRosterStudents(rosterId);
  const updateAssessment = useUpdateStudentAssessment();
  const bulkUpdateAttendance = useBulkUpdateAttendance();
  
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [studentUpdates, setStudentUpdates] = useState<Record<string, any>>({});

  const handleSaveStudent = async (studentId: string) => {
    const updates = studentUpdates[studentId];
    if (!updates || !user?.id) return;

    await updateAssessment.mutateAsync({
      studentId,
      updates: {
        ...updates,
        assessed_by: user.id,
        completion_date: updates.completion_status === 'completed' ? new Date().toISOString() : null
      }
    });
    
    setEditingStudent(null);
    setStudentUpdates(prev => ({ ...prev, [studentId]: {} }));
  };

  const handleBulkAttendance = async (status: string) => {
    if (!rosterId || !user?.id) return;
    
    await bulkUpdateAttendance.mutateAsync({
      rosterId,
      attendanceStatus: status,
      assessedBy: user.id
    });
  };

  const handleSubmitForCertificates = async () => {
    if (!rosterId || !students) return;
    
    const completedStudents = students.filter((s: StudentData) => s.completion_status === 'completed');
    
    if (completedStudents.length === 0) {
      toast.error('No students have completed the course yet');
      return;
    }

    try {
      // Create certificate requests for completed students
      const certificateRequests = completedStudents.map((student: StudentData) => ({
        roster_id: rosterId,
        student_id: student.id,
        recipient_name: student.student_enrollment_profiles?.display_name || 'Unknown',
        student_email: student.student_enrollment_profiles?.email || '',
        course_name: course?.title || 'Course',
        completion_date: student.completion_date || new Date().toISOString(),
        issue_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        practical_score: student.practical_score,
        written_score: student.written_score,
        status: 'pending',
        requested_by: user?.id
      }));

      const { error } = await supabase
        .from('certificate_requests')
        .insert(certificateRequests);

      if (error) throw error;
      
      toast.success(`Certificate requests created for ${completedStudents.length} students`);
      
    } catch (error: any) {
      toast.error(`Failed to create certificate requests: ${error.message}`);
    }
  };

  const updateStudentField = (studentId: string, field: string, value: any) => {
    setStudentUpdates(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const getStudentValue = (student: StudentData, field: string) => {
    return studentUpdates[student.id]?.[field] ?? (student as any)[field];
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="p-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/instructor/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Enrolled</h3>
            <p className="text-muted-foreground">This roster doesn't have any students enrolled yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = students.filter((s: StudentData) => s.completion_status === 'completed').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/instructor/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{course?.title || 'Course Roster'}</h1>
            <p className="text-muted-foreground">
              {course?.booking_date && format(new Date(course.booking_date), 'MMM dd, yyyy')} • 
              {students.length} students • {completedCount} completed
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleBulkAttendance('present')}
            disabled={bulkUpdateAttendance.isPending}
          >
            Mark All Present
          </Button>
          <Button 
            onClick={handleSubmitForCertificates}
            disabled={completedCount === 0}
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Submit for Certificates ({completedCount})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Roster & Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.map((student: StudentData) => (
              <div key={student.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {student.student_enrollment_profiles?.display_name || 'Unknown Student'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {student.student_enrollment_profiles?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={student.completion_status === 'completed' ? 'default' : 'secondary'}>
                      {student.completion_status}
                    </Badge>
                    {editingStudent === student.id ? (
                      <Button size="sm" onClick={() => handleSaveStudent(student.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingStudent(student.id)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {editingStudent === student.id ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Attendance</label>
                      <Select
                        value={getStudentValue(student, 'attendance_status')}
                        onValueChange={(value) => updateStudentField(student.id, 'attendance_status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Practical Score</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={getStudentValue(student, 'practical_score') || ''}
                        onChange={(e) => updateStudentField(student.id, 'practical_score', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Written Score</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={getStudentValue(student, 'written_score') || ''}
                        onChange={(e) => updateStudentField(student.id, 'written_score', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={getStudentValue(student, 'completion_status')}
                        onValueChange={(value) => updateStudentField(student.id, 'completion_status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-2 md:col-span-4">
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={getStudentValue(student, 'notes') || ''}
                        onChange={(e) => updateStudentField(student.id, 'notes', e.target.value)}
                        placeholder="Assessment notes..."
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Attendance:</span>
                      <Badge variant="outline" className="ml-2">
                        {student.attendance_status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Practical:</span>
                      <span className="ml-2">{student.practical_score ?? 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Written:</span>
                      <span className="ml-2">{student.written_score ?? 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Completed:</span>
                      <span className="ml-2">
                        {student.completion_date ? format(new Date(student.completion_date), 'MMM dd') : 'N/A'}
                      </span>
                    </div>
                    {student.notes && (
                      <div className="col-span-2 md:col-span-4">
                        <span className="font-medium">Notes:</span>
                        <p className="mt-1 text-muted-foreground">{student.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}