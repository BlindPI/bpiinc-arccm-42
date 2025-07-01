
import React from 'react';
import { format } from 'date-fns';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CoursePrerequisite } from '@/types/courses';
import { PrerequisiteActions } from './PrerequisiteActions';

interface PrerequisiteRowProps {
  prerequisite: CoursePrerequisite;
  courseName: string;
  onEdit: (prerequisite: CoursePrerequisite) => void;
  onDelete: (prerequisite: CoursePrerequisite) => void;
}

export function PrerequisiteRow({ 
  prerequisite, 
  courseName, 
  onEdit, 
  onDelete 
}: PrerequisiteRowProps) {
  return (
    <TableRow key={prerequisite.id}>
      <TableCell className="font-medium">
        {courseName}
      </TableCell>
      <TableCell>
        {prerequisite.prerequisite_course?.name || "Unknown Course"}
      </TableCell>
      <TableCell>
        <Badge
          variant={prerequisite.is_required ? "default" : "outline"}
          className={
            prerequisite.is_required
              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
          }
        >
          {prerequisite.is_required ? "Required" : "Recommended"}
        </Badge>
      </TableCell>
      <TableCell>
        {format(new Date(prerequisite.updated_at), "MMM d, yyyy")}
      </TableCell>
      <TableCell>
        <PrerequisiteActions 
          prerequisite={prerequisite}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
