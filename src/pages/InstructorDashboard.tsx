import React, { useState } from 'react';
import { useInstructorCourses, useCreateRosterForBooking } from '@/hooks/useInstructorCourses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Users, BookOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const statusColors = {
  'no_students': 'bg-gray-500',
  'not_started': 'bg-yellow-500', 
  'in_progress': 'bg-blue-500',
  'completed': 'bg-green-500'
};

const statusLabels = {
  'no_students': 'No Students',
  'not_started': 'Not Started',
  'in_progress': 'In Progress', 
  'completed': 'Completed'
};

export default function InstructorDashboard() {
  const { data: courses, isLoading } = useInstructorCourses();
  const navigate = useNavigate();
  const createRoster = useCreateRosterForBooking();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [rosterName, setRosterName] = useState('');

  const handleCreateRoster = async () => {
    if (!selectedCourse || !rosterName.trim()) return;
    
    await createRoster.mutateAsync({
      bookingId: selectedCourse.booking_id,
      rosterName: rosterName.trim(),
      courseTitle: selectedCourse.title
    });
    
    setDialogOpen(false);
    setRosterName('');
    setSelectedCourse(null);
  };

  const openCreateRosterDialog = (course: any) => {
    setSelectedCourse(course);
    setRosterName(`${course.title} - ${format(new Date(course.booking_date), 'MMM dd')}`);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Assigned Courses</h1>
          <p className="text-muted-foreground">Manage your course rosters and student assessments</p>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <span className="text-sm font-medium">{courses.length} courses</span>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assigned Courses</h3>
            <p className="text-muted-foreground">You don't have any courses assigned to you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.booking_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <Badge 
                    className={`${statusColors[course.completion_status as keyof typeof statusColors]} text-white`}
                  >
                    {statusLabels[course.completion_status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(course.booking_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{course.start_time} - {course.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{course.student_count} students</span>
                  </div>
                  {course.roster_name && (
                    <div className="text-xs text-muted-foreground">
                      Roster: {course.roster_name}
                    </div>
                  )}
                </div>
                
                {!course.roster_id ? (
                  <Button 
                    className="w-full"
                    onClick={() => openCreateRosterDialog(course)}
                    disabled={createRoster.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Roster
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/instructor/roster/${course.roster_id}`, {
                      state: { course }
                    })}
                  >
                    Manage Roster ({course.student_count})
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Roster for Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-title">Course</Label>
              <Input
                id="course-title"
                value={selectedCourse?.title || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="roster-name">Roster Name</Label>
              <Input
                id="roster-name"
                value={rosterName}
                onChange={(e) => setRosterName(e.target.value)}
                placeholder="Enter roster name..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRoster}
                disabled={!rosterName.trim() || createRoster.isPending}
              >
                {createRoster.isPending ? 'Creating...' : 'Create Roster'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}