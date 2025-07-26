import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
interface AvailabilityBooking {
  id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  booking_type: string;
  title: string;
  description: string | null;
  status: string;
  [key: string]: any;
}

interface AvailabilityBookingsProps {
  bookings: AvailabilityBooking[];
}

const BOOKING_TYPE_CONFIG = {
  course_instruction: { label: 'Course Instruction', color: 'bg-blue-500', icon: Users },
  training_session: { label: 'Training Session', color: 'bg-green-500', icon: Users },
  meeting: { label: 'Meeting', color: 'bg-purple-500', icon: Users },
  administrative: { label: 'Administrative', color: 'bg-orange-500', icon: Calendar },
  personal: { label: 'Personal', color: 'bg-gray-500', icon: Calendar },
};

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', variant: 'default' as const },
  confirmed: { label: 'Confirmed', variant: 'default' as const },
  in_progress: { label: 'In Progress', variant: 'secondary' as const },
  completed: { label: 'Completed', variant: 'outline' as const },
  cancelled: { label: 'Cancelled', variant: 'destructive' as const },
};

export function AvailabilityBookings({ bookings }: AvailabilityBookingsProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes}min`;
    }
    
    return `${diffHours}h`;
  };

  const groupBookingsByDate = (bookings: AvailabilityBooking[]) => {
    return bookings.reduce((acc, booking) => {
      const date = booking.booking_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(booking);
      return acc;
    }, {} as Record<string, AvailabilityBooking[]>);
  };

  const groupedBookings = groupBookingsByDate(bookings);

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No upcoming bookings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedBookings)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, dayBookings]) => (
          <div key={date} className="space-y-3">
            <h3 className="font-medium text-lg">{formatDate(date)}</h3>
            
            <div className="grid gap-3">
              {dayBookings
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((booking) => {
                  const typeConfig = BOOKING_TYPE_CONFIG[booking.booking_type as keyof typeof BOOKING_TYPE_CONFIG];
                  const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
                  const IconComponent = typeConfig?.icon || Calendar;
                  
                  return (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${typeConfig?.color || 'bg-gray-500'}`} />
                            <h4 className="font-medium">{booking.title}</h4>
                          </div>
                          <Badge variant={statusConfig?.variant || 'default'}>
                            {statusConfig?.label || booking.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                            <span className="ml-1">({calculateDuration(booking.start_time, booking.end_time)})</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <IconComponent className="h-4 w-4" />
                            {typeConfig?.label || booking.booking_type}
                          </div>
                        </div>
                        
                        {booking.description && (
                          <p className="text-sm">{booking.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {booking.hours_credited && booking.hours_credited > 0 && (
                            <span>Credit: {booking.hours_credited}h</span>
                          )}
                          {booking.billable_hours && booking.billable_hours > 0 && (
                            <span>Billable: {booking.billable_hours}h</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}
    </div>
  );
}