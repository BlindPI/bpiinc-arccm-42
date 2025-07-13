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
  Loader2
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
    date: event?.start ? new Date(event.start).toISOString().split('T')[0] : ''
  });

  if (!event) return null;

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
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isEditing ? 'Edit Event' : 'Event Details'}
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

        <div className="space-y-4 overflow-y-auto flex-1">
          {isEditing ? (
            /* Edit Form */
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="bookingType">Type</Label>
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

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              {/* Event Title and Status */}
              <div>
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getStatusColor(event.extendedProps.status)}>
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

              <Separator />

              {/* Event Details */}
              <div className="space-y-3">
                {/* Date and Time */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(event.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(event.start).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })} - {new Date(event.end).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{event.extendedProps.instructorName}</span>
                </div>

                {/* Course (if applicable) */}
                {event.extendedProps.courseName && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{event.extendedProps.courseName}</span>
                  </div>
                )}

                {/* Location (if applicable) */}
                {event.extendedProps.locationName && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{event.extendedProps.locationName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{event.title}"? This action cannot be undone.
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
                          Delete Event
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};