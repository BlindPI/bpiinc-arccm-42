import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Users, Clock, Search, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { InstructorAvailability } from '@/hooks/useCalendarScheduling';

interface InstructorAvailabilityPanelProps {
  instructorAvailability: InstructorAvailability[];
  selectedDate: Date;
  onInstructorSelect?: (instructorId: string) => void;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const InstructorAvailabilityPanel: React.FC<InstructorAvailabilityPanelProps> = ({
  instructorAvailability,
  selectedDate,
  onInstructorSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);

  const filteredInstructors = instructorAvailability.filter(instructor =>
    instructor.instructorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailabilityForDay = (instructor: InstructorAvailability, dayOfWeek: number) => {
    return instructor.availability.filter(avail => avail.dayOfWeek === dayOfWeek);
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'IC': return 'bg-green-100 text-green-800';
      case 'IP': return 'bg-yellow-100 text-yellow-800';
      case 'IT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'IC': return 'Certified';
      case 'IP': return 'Provisional';
      case 'IT': return 'In Training';
      default: return role;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Instructor Availability</h3>
        </div>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredInstructors.map((instructor) => (
            <Card 
              key={instructor.instructorId}
              className={`cursor-pointer transition-all ${
                selectedInstructor === instructor.instructorId
                  ? 'ring-2 ring-primary shadow-md'
                  : 'hover:shadow-sm'
              }`}
              onClick={() => {
                setSelectedInstructor(instructor.instructorId);
                onInstructorSelect?.(instructor.instructorId);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{instructor.instructorName}</CardTitle>
                  </div>
                  <Badge className={getRoleBadgeColor(instructor.role)} variant="secondary">
                    {getRoleLabel(instructor.role)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {instructor.availability.length > 0 ? (
                  <div className="space-y-2">
                    {instructor.availability.map((avail, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">
                          {dayNames[avail.dayOfWeek]}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-green-600 font-medium">
                            {formatTime(avail.startTime)} - {formatTime(avail.endTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    No availability set
                  </div>
                )}
                
                {/* Show today's availability prominently */}
                {(() => {
                  const todayAvailability = getAvailabilityForDay(instructor, selectedDate.getDay());
                  if (todayAvailability.length > 0) {
                    return (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm font-medium text-green-800 mb-1">
                          Available Today
                        </div>
                        {todayAvailability.map((avail, index) => (
                          <div key={index} className="text-sm text-green-700">
                            {formatTime(avail.startTime)} - {formatTime(avail.endTime)}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>
          ))}
          
          {filteredInstructors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No instructors found</p>
              {searchTerm && (
                <p className="text-sm mt-1">Try adjusting your search terms</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};