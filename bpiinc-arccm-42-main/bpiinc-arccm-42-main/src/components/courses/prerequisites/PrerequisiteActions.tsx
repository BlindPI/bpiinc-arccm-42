
import React from 'react';
import { Button } from '@/components/ui/button';
import { PencilIcon, Trash2 } from 'lucide-react';
import { CoursePrerequisite } from '@/types/courses';

interface PrerequisiteActionsProps {
  prerequisite: CoursePrerequisite;
  onEdit: (prerequisite: CoursePrerequisite) => void;
  onDelete: (prerequisite: CoursePrerequisite) => void;
}

export function PrerequisiteActions({ prerequisite, onEdit, onDelete }: PrerequisiteActionsProps) {
  return (
    <div className="text-right space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onEdit(prerequisite)}
        title="Edit Prerequisite"
      >
        <PencilIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDelete(prerequisite)}
        title="Delete Prerequisite"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}
