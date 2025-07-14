import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Clock, 
  Coffee,
  Move3D,
  BookOpen
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export interface CourseSequenceItem {
  id: string;
  type: 'course' | 'break';
  courseId?: string;
  courseName?: string;
  duration: number; // in minutes
  breakType?: 'short' | 'lunch' | 'extended';
  notes?: string;
}

export interface CourseSequence {
  items: CourseSequenceItem[];
  totalDuration: number;
}

interface CourseSequenceBuilderProps {
  sequence: CourseSequence;
  onSequenceChange: (sequence: CourseSequence) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function CourseSequenceBuilder({
  sequence,
  onSequenceChange,
  label = "Training Day Sequence",
  placeholder = "Build your training day sequence",
  required = false
}: CourseSequenceBuilderProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ['courses-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, description')
        .eq('status', 'ACTIVE')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const addCourse = () => {
    if (!selectedCourseId) return;
    
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;

    const newItem: CourseSequenceItem = {
      id: `course-${Date.now()}`,
      type: 'course',
      courseId: course.id,
      courseName: course.name,
      duration: 120 // Default 2 hours
    };

    const newSequence = {
      items: [...sequence.items, newItem],
      totalDuration: sequence.totalDuration + newItem.duration
    };

    onSequenceChange(newSequence);
    setSelectedCourseId('');
  };

  const addBreak = (breakType: 'short' | 'lunch' | 'extended') => {
    const breakDurations = {
      short: 15,
      lunch: 60,
      extended: 30
    };

    const breakLabels = {
      short: 'Short Break',
      lunch: 'Lunch Break', 
      extended: 'Extended Break'
    };

    const newItem: CourseSequenceItem = {
      id: `break-${Date.now()}`,
      type: 'break',
      breakType,
      courseName: breakLabels[breakType],
      duration: breakDurations[breakType]
    };

    const newSequence = {
      items: [...sequence.items, newItem],
      totalDuration: sequence.totalDuration + newItem.duration
    };

    onSequenceChange(newSequence);
  };

  const removeItem = (itemId: string) => {
    const itemToRemove = sequence.items.find(item => item.id === itemId);
    if (!itemToRemove) return;

    const newSequence = {
      items: sequence.items.filter(item => item.id !== itemId),
      totalDuration: sequence.totalDuration - itemToRemove.duration
    };

    onSequenceChange(newSequence);
  };

  const updateItemDuration = (itemId: string, newDuration: number) => {
    const updatedItems = sequence.items.map(item => {
      if (item.id === itemId) {
        return { ...item, duration: newDuration };
      }
      return item;
    });

    const newTotalDuration = updatedItems.reduce((total, item) => total + item.duration, 0);

    onSequenceChange({
      items: updatedItems,
      totalDuration: newTotalDuration
    });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sequence.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onSequenceChange({
      ...sequence,
      items
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  const getItemIcon = (item: CourseSequenceItem) => {
    if (item.type === 'break') {
      return <Coffee className="h-4 w-4" />;
    }
    return <BookOpen className="h-4 w-4" />;
  };

  const getItemBadgeVariant = (item: CourseSequenceItem) => {
    if (item.type === 'break') {
      switch (item.breakType) {
        case 'short': return 'secondary';
        case 'lunch': return 'default';
        case 'extended': return 'outline';
        default: return 'secondary';
      }
    }
    return 'default';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Build a sequence of courses and breaks for your training day
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">Total Duration</div>
          <div className="text-lg font-bold text-primary">
            {formatDuration(sequence.totalDuration)}
          </div>
        </div>
      </div>

      {/* Course Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="course-select" className="text-sm">Add Course</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course to add..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={addCourse} 
              disabled={!selectedCourseId}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Course
            </Button>
          </div>

          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addBreak('short')}
            >
              <Coffee className="h-3 w-3 mr-1" />
              Short Break (15m)
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addBreak('extended')}
            >
              <Coffee className="h-3 w-3 mr-1" />
              Break (30m)
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addBreak('lunch')}
            >
              <Coffee className="h-3 w-3 mr-1" />
              Lunch (1h)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sequence Display */}
      {sequence.items.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Move3D className="h-4 w-4" />
              Training Day Sequence ({sequence.items.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="course-sequence">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {sequence.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div {...provided.dragHandleProps} className="text-muted-foreground hover:text-foreground">
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
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Timeline Summary */}
            <Separator className="my-4" />
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between mb-2">
                <span>Training Day Timeline:</span>
                <span className="font-medium">{formatDuration(sequence.totalDuration)}</span>
              </div>
              <div className="space-y-1">
                {sequence.items.map((item, index) => {
                  const startTime = sequence.items.slice(0, index).reduce((acc, prev) => acc + prev.duration, 0);
                  const startHour = Math.floor(startTime / 60) + 9; // Start at 9 AM
                  const startMin = startTime % 60;
                  const endTime = startTime + item.duration;
                  const endHour = Math.floor(endTime / 60) + 9;
                  const endMinute = endTime % 60;

                  return (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span>{item.courseName}</span>
                      <span>
                        {String(startHour).padStart(2, '0')}:{String(startMin).padStart(2, '0')} - 
                        {String(endHour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sequence.items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{placeholder}</p>
          <p className="text-xs mt-1">Add courses and breaks to build your training day</p>
        </div>
      )}
    </div>
  );
}