import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, BookOpen, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { ThinkificProgressDashboard } from '@/components/enrollment/ThinkificProgressDashboard';
import { StudentWithProgress, ThinkificCourseProgress } from '@/services/enrollment/thinkificProgressService';
import { useCourses } from '@/hooks/useCourses';
import { useCreateEnrollment } from '@/hooks/useEnrollment';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const ThinkificProgress: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProgress | null>(null);
  const [selectedThinkificCourse, setSelectedThinkificCourse] = useState<ThinkificCourseProgress | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedLocalCourse, setSelectedLocalCourse] = useState<string>('');

  const { data: localCourses, isLoading: coursesLoading } = useCourses();
  const createEnrollment = useCreateEnrollment();

  const handleAssignToLocalCourse = (student: StudentWithProgress, thinkificCourse: ThinkificCourseProgress) => {
    setSelectedStudent(student);
    setSelectedThinkificCourse(thinkificCourse);
    setAssignmentDialogOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedStudent || !selectedThinkificCourse || !selectedLocalCourse) {
      toast.error('Please select a local course for assignment');
      return;
    }

    try {
      const enrollmentData = {
        student_id: selectedStudent.id,
        course_id: selectedLocalCourse,
        enrollment_date: new Date().toISOString(),
        status: 'ENROLLED' as const,
        notes: `Assigned based on Thinkific course: ${selectedThinkificCourse.course_name} (${selectedThinkificCourse.progress_percentage}% complete)`,
        metadata: {
          thinkific_source: {
            course_id: selectedThinkificCourse.thinkific_course_id,
            course_name: selectedThinkificCourse.course_name,
            enrollment_id: selectedThinkificCourse.thinkific_enrollment_id,
            progress_percentage: selectedThinkificCourse.progress_percentage,
            completion_status: selectedThinkificCourse.completion_status,
            total_score: selectedThinkificCourse.total_score,
            assigned_at: new Date().toISOString()
          }
        }
      };

      await createEnrollment.mutateAsync(enrollmentData);
      
      toast.success(`Successfully assigned ${selectedStudent.display_name} to local course`);
      setAssignmentDialogOpen(false);
      setSelectedStudent(null);
      setSelectedThinkificCourse(null);
      setSelectedLocalCourse('');
    } catch (error) {
      console.error('Error creating enrollment:', error);
      toast.error('Failed to assign student to local course');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/training')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training Hub
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Thinkific Progress Management</h1>
            <p className="text-muted-foreground">
              View student progress from Thinkific and assign them to local courses
            </p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This dashboard shows student progress imported from Thinkific. You can review their course completion 
          status and manually assign them to appropriate local courses based on their external progress.
        </AlertDescription>
      </Alert>

      {/* Main Dashboard */}
      <ThinkificProgressDashboard onAssignToLocalCourse={handleAssignToLocalCourse} />

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to Local Course</DialogTitle>
            <DialogDescription>
              Assign {selectedStudent?.display_name} to a local course based on their Thinkific progress
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Student Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Student</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedStudent?.display_name}</div>
                    <div className="text-sm text-muted-foreground">{selectedStudent?.email}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Thinkific Course Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Thinkific Course Progress</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{selectedThinkificCourse?.course_name}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant={selectedThinkificCourse?.completion_status === 'COMPLETED' ? 'default' : 'secondary'}
                      >
                        {selectedThinkificCourse?.completion_status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {selectedThinkificCourse?.progress_percentage}% complete
                      </span>
                      {selectedThinkificCourse?.total_score && (
                        <span className="text-sm text-muted-foreground">
                          Score: {selectedThinkificCourse.total_score}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Local Course Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Local Course</label>
              <Select value={selectedLocalCourse} onValueChange={setSelectedLocalCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a local course..." />
                </SelectTrigger>
                <SelectContent>
                  {coursesLoading ? (
                    <SelectItem value="" disabled>Loading courses...</SelectItem>
                  ) : localCourses?.length === 0 ? (
                    <SelectItem value="" disabled>No courses available</SelectItem>
                  ) : (
                    localCourses?.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Assignment Note */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This will create a new enrollment record linking the student's Thinkific progress 
                to the selected local course. The assignment metadata will include their external progress data.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setAssignmentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmAssignment}
                disabled={!selectedLocalCourse || createEnrollment.isPending}
              >
                {createEnrollment.isPending ? 'Assigning...' : 'Assign to Course'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThinkificProgress;