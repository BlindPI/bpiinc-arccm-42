
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { usePrerequisites } from '@/hooks/usePrerequisites';
import { useCourseData } from '@/hooks/useCourseData';
import { PrerequisiteDialog } from './PrerequisiteDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, PencilIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CoursePrerequisite } from '@/types/courses';

export function PrerequisitesTable() {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const { data: courses = [], isLoading: isCoursesLoading } = useCourseData();
  const {
    prerequisites = [], // Provide default empty array
    isLoading,
    createPrerequisite,
    updatePrerequisite,
    deletePrerequisite
  } = usePrerequisites();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPrereq, setEditingPrereq] = React.useState<CoursePrerequisite | undefined>(undefined);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [courseFilter, setCourseFilter] = React.useState('all');

  const handleAddClick = () => {
    setEditingPrereq(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (prereq: CoursePrerequisite) => {
    setEditingPrereq(prereq);
    setDialogOpen(true);
  };

  const handleDeleteClick = (prereq: CoursePrerequisite) => {
    if (window.confirm('Are you sure you want to delete this prerequisite?')) {
      deletePrerequisite.mutate(prereq.id);
    }
  };

  const handleSubmit = (data: any) => {
    if (data.id) {
      updatePrerequisite.mutate(data);
    } else {
      createPrerequisite.mutate(data);
    }
    setDialogOpen(false);
  };

  // Get course name by ID
  const getCourseNameById = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  // Filter prerequisites based on search term and course filter
  const filteredPrerequisites = React.useMemo(() => {
    // Ensure prerequisites is an array before filtering
    const prereqArray = Array.isArray(prerequisites) ? prerequisites : [];
    let filtered = [...prereqArray];
    
    if (courseFilter !== 'all') {
      filtered = filtered.filter(p => p.course_id === courseFilter);
    }
    
    if (!searchTerm.trim()) return filtered;
    
    return filtered.filter(p => {
      const courseName = getCourseNameById(p.course_id).toLowerCase();
      const prereqCourseName = getCourseNameById(p.prerequisite_course_id).toLowerCase();
      return (
        courseName.includes(searchTerm.toLowerCase()) ||
        prereqCourseName.includes(searchTerm.toLowerCase())
      );
    });
  }, [prerequisites, searchTerm, courseFilter, courses]);

  if (!isAdmin) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Prerequisites</CardTitle>
            <CardDescription>Manage prerequisite requirements between courses</CardDescription>
          </div>
          <Button onClick={handleAddClick} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Prerequisite
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prerequisites..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-64">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading || isCoursesLoading ? (
            <div className="space-y-2">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Prerequisite Course</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrerequisites.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center h-24 text-muted-foreground"
                      >
                        {searchTerm || courseFilter !== 'all' ? 'No matching prerequisites found' : 'No prerequisites found. Add your first one.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrerequisites.map((prereq) => (
                      <TableRow key={prereq.id}>
                        <TableCell className="font-medium">
                          {getCourseNameById(prereq.course_id)}
                        </TableCell>
                        <TableCell>
                          {getCourseNameById(prereq.prerequisite_course_id)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={prereq.is_required ? "default" : "outline"}
                            className={
                              prereq.is_required
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {prereq.is_required ? "Required" : "Recommended"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(prereq.updated_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(prereq)}
                            title="Edit Prerequisite"
                          >
                            <PencilIcon className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteClick(prereq)}
                            title="Delete Prerequisite"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PrerequisiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingPrereq}
        courses={courses}
      />
    </>
  );
}
