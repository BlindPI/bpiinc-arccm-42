import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Clock, Trash2 } from 'lucide-react';
import { CourseSequenceItem } from './CourseSequenceBuilder';

interface SortableSequenceItemProps {
  item: CourseSequenceItem;
  updateItemDuration: (itemId: string, newDuration: number) => void;
  removeItem: (itemId: string) => void;
  getItemIcon: (item: CourseSequenceItem) => React.ReactNode;
  getItemBadgeVariant: (item: CourseSequenceItem) => any;
}

export function SortableSequenceItem({
  item,
  updateItemDuration,
  removeItem,
  getItemIcon,
  getItemBadgeVariant
}: SortableSequenceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <div className="flex items-center gap-2 flex-1">
        {getItemIcon(item)}
        <span className="font-medium">{item.courseName}</span>
        <Badge variant={getItemBadgeVariant(item)} className="text-xs">
          {item.type === 'course' ? 'Course' : 'Break'}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <Input
            type="number"
            value={item.duration}
            onChange={(e) => updateItemDuration(item.id, parseInt(e.target.value) || 0)}
            className="w-16 h-7 text-xs"
            min="5"
            max="480"
          />
          <span className="text-xs">min</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeItem(item.id)}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}