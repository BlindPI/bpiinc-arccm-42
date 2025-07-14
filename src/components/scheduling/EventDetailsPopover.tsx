import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { TrainingSessionBuilder } from '../course-sequence/TrainingSessionBuilder';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  BookOpen,
  X,
  Edit,
  Trash2,
  Save,
  Loader2,
  Users,
  GraduationCap,
  FileText,
  BarChart3,
  CheckCircle,
  Clock4,
  Coffee
} from 'lucide-react';

interface EventDetailsPopoverProps {
  event: any;
  onClose: () => void;
  onEdit?: (eventData: any) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

export const EventDetailsPopover: React.FC<EventDetailsPopoverProps> = ({
  event,
  onClose,
  onEdit,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    title: event?.title || '',
    description: event?.extendedProps?.description || '',
    bookingType: event?.extendedProps?.bookingType || 'course_instruction',
    startTime: event?.start ? new Date(event.start).toTimeString().slice(0, 5) : '',
    endTime: event?.end ? new Date(event.end).toTimeString().slice(0, 5) : '',
    date: event?.start ? new Date(event.start).toISOString().split('T')[0] : '',
    courseSequence: event?.extendedProps?.courseSequence || []
  });

  if (!event) return null;

  // Parse course sequence data from event
  const courseSequence = event?.extendedProps?.courseSequence || [];
  const totalDuration = courseSequence.reduce((acc: number, item: any) => 
    acc + (item.type === 'course' ? item.duration : item.duration || 0), 0
  );
  const completedCourses = courseSequence.filter((item: any) => 
    item.type === 'course' && item.completed
  ).length;
  const totalCourses = courseSequence.filter((item: any) => item.type === 'course').length;
  const progress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case 'course_instruction':
        return 'bg-green-100 text-green-800';
      case 'training_session':
        return 'bg-purple-100 text-purple-800';
      case 'meeting':
        return 'bg-red-100 text-red-800';
      case 'administrative':
        return 'bg-emerald-100 text-emerald-800';
      case 'personal':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleSave = async () => {
    if (!onEdit) return;
    
    setIsSaving(true);
    try {
      await onEdit({
        id: event.id,
        title: editData.title,
        description: editData.description,
        booking_type: editData.bookingType,
        booking_date: editData.date,
        start_time: editData.startTime,
        end_time: editData.endTime
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={!!event} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {isEditing ? 'Edit Training Session' : 'Training Session Details'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-6">
          {isEditing ? (
            /* Edit Form */
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    placeholder="e.g., Multi-Course CPR & First Aid Training"
                  />
                </div>
                <div>
                  <Label htmlFor="bookingType">Session Type</Label>
                  <Select value={editData.bookingType} onValueChange={(value) => setEditData({ ...editData, bookingType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course_instruction">Course Instruction</SelectItem>
                      <SelectItem value="training_session">Training Session</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the training session objectives and content..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={editData.startTime}
                    onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={editData.endTime}
                    onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Course Sequence</Label>
                <TrainingSessionBuilder
                  session={{
                    title: editData.title,
                    description: editData.description,
                    date: editData.date,
                    startTime: editData.startTime,
                    courseSequence: { 
                      items: editData.courseSequence,
                      totalDuration: editData.courseSequence.reduce((acc: number, item: any) => 
                        acc + (item.duration || 0), 0
                      )
                    }
                  }}
                  onSessionChange={(session) => setEditData({ 
                    ...editData, 
                    courseSequence: session.courseSequence.items,
                    title: session.title,
                    description: session.description 
                  })}
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Session Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {event.extendedProps.description || 'Multi-course training session'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getStatusColor(event.extendedProps.status)} className="capitalize">
                          {event.extendedProps.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getBookingTypeColor(event.extendedProps.bookingType)}
                        >
                          {event.extendedProps.bookingType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Date</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.start).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Duration</p>
                          <p className="text-xs text-muted-foreground">{totalDuration} minutes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Instructor</p>
                          <p className="text-xs text-muted-foreground">{event.extendedProps.instructorName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-xs text-muted-foreground">
                            {event.extendedProps.locationName || 'TBD'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Course Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{totalCourses}</p>
                        <p className="text-sm text-muted-foreground">Total Courses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{completedCourses}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{totalCourses - completedCourses}</p>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock4 className="h-5 w-5" />
                      Training Day Schedule
                    </CardTitle>
                    <CardDescription>
                      Detailed timeline for {new Date(event.start).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {courseSequence.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                          <div className="flex-shrink-0 w-16 text-center">
                            <p className="text-sm font-medium">
                              {item.startTime || '9:00 AM'}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {item.type === 'course' ? (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                                <BookOpen className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
                                <Coffee className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{item.courseName || item.label}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{item.duration}min</span>
                                {item.completed && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </div>
                            {item.type === 'course' && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.courseCode} • {item.description || 'Course instruction and practical training'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="participants" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Enrolled Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="text-center">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>Participant management integration coming soon</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Session Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Completion Rate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
                            <Progress value={progress} className="mt-2" />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Time Elapsed</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {Math.round((completedCourses / totalCourses) * totalDuration)} min
                            </div>
                            <p className="text-sm text-muted-foreground">of {totalDuration} minutes</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Session
                </Button>
              )}
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export Report
              </Button>
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Session
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Training Session</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{event.title}"? This will remove the entire multi-course training session. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Delete Session
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};