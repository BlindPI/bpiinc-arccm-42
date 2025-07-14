import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Search, Clock, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { InstructorAvailability } from '@/hooks/useCalendarScheduling';

interface InstructorAvailabilityDropdownProps {
  instructorAvailability: InstructorAvailability[];
  selectedDate: Date;
  onInstructorSelect?: (instructorId: string) => void;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const InstructorAvailabilityDropdown: React.FC<InstructorAvailabilityDropdownProps> = ({
  instructorAvailability,
  selectedDate,
  onInstructorSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'IC': return 'default';
      case 'IP': return 'secondary';
      case 'IT': return 'outline';
      default: return 'secondary';
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

  const availableToday = filteredInstructors.filter(instructor => 
    getAvailabilityForDay(instructor, selectedDate.getDay()).length > 0
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Instructor Availability
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Available Today - {format(selectedDate, 'MMM d')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        <ScrollArea className="h-64">
          <div className="px-2 pb-2">
            {availableToday.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-green-600 mb-2 px-2">
                  Available Now ({availableToday.length})
                </div>
                {availableToday.map((instructor) => {
                  const todayAvailability = getAvailabilityForDay(instructor, selectedDate.getDay());
                  return (
                    <div
                      key={instructor.instructorId}
                      className="p-2 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => {
                        onInstructorSelect?.(instructor.instructorId);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{instructor.instructorName}</span>
                        <Badge variant={getRoleBadgeVariant(instructor.role)} className="text-xs">
                          {getRoleLabel(instructor.role)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Clock className="h-3 w-3" />
                        {todayAvailability.map((avail, index) => (
                          <span key={index}>
                            {formatTime(avail.startTime)} - {formatTime(avail.endTime)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredInstructors.length > availableToday.length && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                  All Instructors ({filteredInstructors.length})
                </div>
                {filteredInstructors.map((instructor) => (
                  <div
                    key={instructor.instructorId}
                    className="p-2 hover:bg-muted/50 rounded cursor-pointer"
                    onClick={() => {
                      onInstructorSelect?.(instructor.instructorId);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{instructor.instructorName}</span>
                      <Badge variant={getRoleBadgeVariant(instructor.role)} className="text-xs">
                        {getRoleLabel(instructor.role)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {instructor.availability.length > 0 ? (
                        instructor.availability.slice(0, 2).map((avail, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{dayNames[avail.dayOfWeek]}</span>
                            <span className="text-muted-foreground">
                              {formatTime(avail.startTime)} - {formatTime(avail.endTime)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">No availability set</div>
                      )}
                      {instructor.availability.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{instructor.availability.length - 2} more days
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredInstructors.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No instructors found</p>
                {searchTerm && (
                  <p className="text-xs mt-1">Try adjusting your search terms</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};