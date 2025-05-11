
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { usePrerequisites } from '@/hooks/usePrerequisites';
import { useCourseData } from '@/hooks/useCourseData';
import { PrerequisiteDialog } from './PrerequisiteDialog';
import { PrerequisiteFilters } from './PrerequisiteFilters';
import { PrerequisiteTableBody } from './PrerequisiteTableBody';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { CoursePrerequisite } from '@/types/courses';

export function PrerequisitesTable() {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const { data: courses = [], isLoading: isCoursesLoading } = useCourseData();
  const {
    prerequisites = [],
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
      // Use getCourseNameById for the course_id
      const courseName = getCourseNameById(p.course_id).toLowerCase();
      // Use the prerequisite_course.name directly now that we've fixed the structure
      const prereqCourseName = p.prerequisite_course?.name?.toLowerCase() || '';
      
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
          <PrerequisiteFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            courseFilter={courseFilter}
            setCourseFilter={setCourseFilter}
            courses={courses}
          />
          
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
                <PrerequisiteTableBody 
                  prerequisites={filteredPrerequisites}
                  getCourseNameById={getCourseNameById}
                  onEditPrerequisite={handleEditClick}
                  onDeletePrerequisite={handleDeleteClick}
                  searchTerm={searchTerm}
                />
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
