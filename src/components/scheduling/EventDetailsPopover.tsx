import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, MapPin, Book, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface EventDetailsPopoverProps {
  event: any;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const EventDetailsPopover: React.FC<EventDetailsPopoverProps> = ({
  event,
  onClose,
  onEdit,
  onDelete
}) => {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);

  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case 'course_instruction':
        return 'bg-green-100 text-green-800';
      case 'training':
        return 'bg-purple-100 text-purple-800';
      case 'meeting':
        return 'bg-red-100 text-red-800';
      case 'available':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Details
          </DialogTitle>
          <DialogDescription>
            View and manage schedule details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
          </div>

          {/* Status and Type Badges */}
          <div className="flex gap-2">
            <Badge className={getBookingTypeColor(event.extendedProps.bookingType)}>
              {event.extendedProps.bookingType.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={getStatusColor(event.extendedProps.status)}>
              {event.extendedProps.status.toUpperCase()}
            </Badge>
          </div>

          <Separator />

          {/* Event Details */}
          <div className="space-y-3">
            {/* Date and Time */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(startDate, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
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
                <Book className="h-4 w-4 text-muted-foreground" />
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

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};