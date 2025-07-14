import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Coffee,
  Plus,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { CourseSequenceBuilder, CourseSequence, CourseSequenceItem } from './CourseSequenceBuilder';

export interface TrainingSession {
  id?: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  instructorId?: string;
  locationId?: string;
  courseSequence: CourseSequence;
  maxCapacity?: number;
}

interface TrainingSessionBuilderProps {
  session: TrainingSession;
  onSessionChange: (session: TrainingSession) => void;
  instructorAvailability?: any[];
  locationId?: string;
  teamId?: string;
}

export function TrainingSessionBuilder({
  session,
  onSessionChange,
  instructorAvailability,
  locationId,
  teamId
}: TrainingSessionBuilderProps) {
  const [showSequenceBuilder, setShowSequenceBuilder] = useState(false);

  const updateSession = (field: keyof TrainingSession, value: any) => {
    onSessionChange({
      ...session,
      [field]: value
    });
  };

  const handleSequenceChange = (newSequence: CourseSequence) => {
    updateSession('courseSequence', newSequence);
    
    // Auto-generate title if empty and sequence has courses
    if (!session.title && newSequence.items.length > 0) {
      const courseNames = newSequence.items
        .filter(item => item.type === 'course')
        .map(item => item.courseName)
        .join(' + ');
      
      if (courseNames) {
        updateSession('title', `${courseNames} Training Session`);
      }
    }
  };

  const calculateEndTime = () => {
    if (!session.startTime || session.courseSequence.totalDuration === 0) {
      return null;
    }

    const [hours, minutes] = session.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + session.courseSequence.totalDuration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
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

  const getSequenceSummary = () => {
    if (session.courseSequence.items.length === 0) {
      return 'No courses selected';
    }

    const courseCount = session.courseSequence.items.filter(item => item.type === 'course').length;
    const breakCount = session.courseSequence.items.filter(item => item.type === 'break').length;
    
    return `${courseCount} course${courseCount !== 1 ? 's' : ''}${breakCount > 0 ? `, ${breakCount} break${breakCount !== 1 ? 's' : ''}` : ''}`;
  };

  const endTime = calculateEndTime();

  return (
    <div className="space-y-6">
      {/* Basic Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Training Session Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={session.title}
                onChange={(e) => updateSession('title', e.target.value)}
                placeholder="Enter session title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={session.date}
                onChange={(e) => updateSession('date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time *</Label>
              <Input
                id="start-time"
                type="time"
                value={session.startTime}
                onChange={(e) => updateSession('startTime', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>End Time (Calculated)</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {endTime || 'Select start time and courses'}
                </span>
                {session.courseSequence.totalDuration > 0 && (
                  <Badge variant="outline" className="ml-auto">
                    {formatDuration(session.courseSequence.totalDuration)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={session.description}
              onChange={(e) => updateSession('description', e.target.value)}
              placeholder="Additional session details"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Course Sequence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Sequence *
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSequenceBuilder(!showSequenceBuilder)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {showSequenceBuilder ? 'Hide Builder' : 'Edit Sequence'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Sequence Summary */}
          {session.courseSequence.items.length > 0 && (
            <div className="mb-4 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Training Day Summary</span>
                <Badge variant="default">
                  {formatDuration(session.courseSequence.totalDuration)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                {getSequenceSummary()}
              </div>
              
              {/* Quick Timeline */}
              <div className="space-y-1">
                {session.courseSequence.items.map((item, index) => {
                  const startTime = session.courseSequence.items.slice(0, index).reduce((acc, prev) => acc + prev.duration, 0);
                  let sessionStartMinutes = 0;
                  
                  if (session.startTime) {
                    const [hours, minutes] = session.startTime.split(':').map(Number);
                    sessionStartMinutes = hours * 60 + minutes;
                  }
                  
                  const itemStartMinutes = sessionStartMinutes + startTime;
                  const itemEndMinutes = itemStartMinutes + item.duration;
                  
                  const startHour = Math.floor(itemStartMinutes / 60);
                  const startMin = itemStartMinutes % 60;
                  const endHour = Math.floor(itemEndMinutes / 60);
                  const endMinute = itemEndMinutes % 60;

                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {item.type === 'course' ? (
                          <BookOpen className="h-3 w-3" />
                        ) : (
                          <Coffee className="h-3 w-3" />
                        )}
                        <span>{item.courseName}</span>
                      </div>
                      <span className="font-mono">
                        {String(startHour).padStart(2, '0')}:{String(startMin).padStart(2, '0')} - 
                        {String(endHour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sequence Builder */}
          {showSequenceBuilder && (
            <CourseSequenceBuilder
              sequence={session.courseSequence}
              onSequenceChange={handleSequenceChange}
              label="Build Training Day Sequence"
              placeholder="Add courses and breaks to create your training session"
              required
            />
          )}

          {/* Empty State */}
          {session.courseSequence.items.length === 0 && !showSequenceBuilder && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No courses selected</p>
              <p className="text-xs mb-3">Click "Edit Sequence" to add courses and breaks</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSequenceBuilder(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Courses
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}