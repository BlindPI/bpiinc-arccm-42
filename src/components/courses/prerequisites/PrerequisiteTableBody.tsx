
import React from 'react';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { CoursePrerequisite } from '@/types/courses';
import { PrerequisiteRow } from './PrerequisiteRow';

interface PrerequisiteTableBodyProps {
  prerequisites: CoursePrerequisite[];
  getCourseNameById: (id: string) => string;
  onEditPrerequisite: (prerequisite: CoursePrerequisite) => void;
  onDeletePrerequisite: (prerequisite: CoursePrerequisite) => void;
  searchTerm: string;
}

export function PrerequisiteTableBody({
  prerequisites,
  getCourseNameById,
  onEditPrerequisite,
  onDeletePrerequisite,
  searchTerm
}: PrerequisiteTableBodyProps) {
  if (prerequisites.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={5}
            className="text-center h-24 text-muted-foreground"
          >
            {searchTerm ? 'No matching prerequisites found' : 'No prerequisites found. Add your first one.'}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {prerequisites.map((prereq) => (
        <PrerequisiteRow
          key={prereq.id}
          prerequisite={prereq}
          courseName={getCourseNameById(prereq.course_id)}
          onEdit={onEditPrerequisite}
          onDelete={onDeletePrerequisite}
        />
      ))}
    </TableBody>
  );
}
