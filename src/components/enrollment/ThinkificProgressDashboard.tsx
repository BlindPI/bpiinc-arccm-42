import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Search, Users, BookOpen, Trophy, Clock, ExternalLink } from 'lucide-react';
import { useThinkificProgress, useThinkificCourses, useRefreshThinkificData } from '@/hooks/useThinkificProgress';
import { StudentWithProgress, ThinkificCourseProgress } from '@/services/enrollment/thinkificProgressService';
import { format } from 'date-fns';

interface ThinkificProgressDashboardProps {
  onAssignToLocalCourse?: (student: StudentWithProgress, thinkificCourse: ThinkificCourseProgress) => void;
}

export const ThinkificProgressDashboard: React.FC<ThinkificProgressDashboardProps> = ({
  onAssignToLocalCourse
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');

  const { data: students, isLoading: studentsLoading, error: studentsError } = useThinkificProgress();
  const { data: courses, isLoading: coursesLoading } = useThinkificCourses();
  const refreshData = useRefreshThinkificData();

  // Filter students based on search and filters
  const filteredStudents = React.useMemo(() => {
    if (!students) return [];

    return students.filter(student => {
      const matchesSearch = 
        student.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCourse = selectedCourse === 'all' || 
        student.thinkific_courses.some(course => course.thinkific_course_id === selectedCourse);

      const matchesProgress = progressFilter === 'all' ||
        (progressFilter === 'completed' && student.thinkific_courses.some(c => c.completion_status === 'COMPLETED')) ||
        (progressFilter === 'in_progress' && student.thinkific_courses.some(c => c.completion_status === 'IN_PROGRESS'));

      return matchesSearch && matchesCourse && matchesProgress;
    });
  }, [students, searchTerm, selectedCourse, progressFilter]);

  const getStudentStats = () => {
    if (!students) return { total: 0, withProgress: 0, completed: 0 };
    
    const total = students.length;
    const withProgress = students.filter(s => s.total_thinkific_courses > 0).length;
    const completed = students.filter(s => 
      s.thinkific_courses.some(c => c.completion_status === 'COMPLETED')
    ).length;

    return { total, withProgress, completed };
  };

  const stats = getStudentStats();

  if (studentsError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading Thinkific progress data: {studentsError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Thinkific Progress Dashboard</h2>
          <p className="text-muted-foreground">
            View and manage student progress from Thinkific courses
          </p>
        </div>
        <Button 
          onClick={() => refreshData.mutate()} 
          disabled={refreshData.isPending}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshData.isPending ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Imported from Thinkific
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Course Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withProgress}</div>
            <p className="text-xs text-muted-foreground">
              Have enrolled in Thinkific courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Students with completions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses?.map(course => (
                  <SelectItem key={course.course_id} value={course.course_id}>
                    {course.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={progressFilter} onValueChange={setProgressFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Students ({filteredStudents.length})</CardTitle>
              <CardDescription>
                Students imported from Thinkific with their course progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found matching your filters
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Thinkific ID</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map(student => (
                      <StudentProgressRow 
                        key={student.id} 
                        student={student}
                        onAssignToLocalCourse={onAssignToLocalCourse}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thinkific Courses</CardTitle>
              <CardDescription>
                Overview of all Thinkific courses with student progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="text-center py-8">Loading courses...</div>
              ) : courses?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No Thinkific courses found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Total Students</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses?.map(course => (
                      <TableRow key={course.course_id}>
                        <TableCell className="font-medium">
                          {course.course_name}
                        </TableCell>
                        <TableCell>{course.total_students}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {course.completed_students}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {course.in_progress_students}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={(course.completed_students / course.total_students) * 100} 
                              className="w-[60px]" 
                            />
                            <span className="text-sm text-muted-foreground">
                              {Math.round((course.completed_students / course.total_students) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface StudentProgressRowProps {
  student: StudentWithProgress;
  onAssignToLocalCourse?: (student: StudentWithProgress, course: ThinkificCourseProgress) => void;
}

const StudentProgressRow: React.FC<StudentProgressRowProps> = ({ 
  student, 
  onAssignToLocalCourse 
}) => {
  const [expanded, setExpanded] = useState(false);

  const getOverallProgress = () => {
    if (student.thinkific_courses.length === 0) return 0;
    const totalProgress = student.thinkific_courses.reduce(
      (sum, course) => sum + course.progress_percentage, 
      0
    );
    return Math.round(totalProgress / student.thinkific_courses.length);
  };

  const getStatusBadge = () => {
    const completed = student.thinkific_courses.filter(c => c.completion_status === 'COMPLETED').length;
    const total = student.thinkific_courses.length;
    
    if (completed === total && total > 0) {
      return <Badge className="bg-green-100 text-green-800">All Complete</Badge>;
    } else if (completed > 0) {
      return <Badge variant="secondary">{completed}/{total} Complete</Badge>;
    } else {
      return <Badge variant="outline">In Progress</Badge>;
    }
  };

  return (
    <>
      <TableRow 
        className="cursor-pointer hover:bg-muted/50" 
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell>
          <div>
            <div className="font-medium">{student.display_name}</div>
            <div className="text-sm text-muted-foreground">{student.email}</div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{student.thinkific_user_id}</Badge>
        </TableCell>
        <TableCell>{student.total_thinkific_courses}</TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <Progress value={getOverallProgress()} className="w-[60px]" />
            <span className="text-sm">{getOverallProgress()}%</span>
            {getStatusBadge()}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {format(new Date(student.last_sync_date), 'MMM d, yyyy')}
          </div>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      
      {expanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            <div className="p-4 space-y-3">
              <h4 className="font-medium">Course Progress Details</h4>
              {student.thinkific_courses.length === 0 ? (
                <p className="text-muted-foreground">No course progress data available</p>
              ) : (
                <div className="space-y-2">
                  {student.thinkific_courses.map((course, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border">
                      <div className="flex-1">
                        <div className="font-medium">{course.course_name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {course.thinkific_course_id}
                        </div>
                        {course.total_score && (
                          <div className="text-sm text-muted-foreground">
                            Score: {course.total_score}%
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Progress value={course.progress_percentage} className="w-[80px]" />
                            <span className="text-sm">{course.progress_percentage}%</span>
                          </div>
                          <Badge 
                            variant={course.completion_status === 'COMPLETED' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {course.completion_status}
                          </Badge>
                        </div>
                        {onAssignToLocalCourse && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onAssignToLocalCourse(student, course)}
                          >
                            Assign to Local Course
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default ThinkificProgressDashboard;