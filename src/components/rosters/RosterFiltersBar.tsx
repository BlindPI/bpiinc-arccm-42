import React, { useState } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCourseData } from '@/hooks/useCourseData';
import { useLocationData } from '@/hooks/useLocationData';
import { RosterFilters } from '@/types/rosters';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface RosterFiltersBarProps {
  filters: RosterFilters;
  onFilterChange: (filters: Partial<RosterFilters>) => void;
  onResetFilters: () => void;
}

export function RosterFiltersBar({ filters, onFilterChange, onResetFilters }: RosterFiltersBarProps) {
  const { data: courses = [] } = useCourseData();
  const { locations = [] } = useLocationData();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const activeCourseFilter = courses.find(course => course.id === filters.courseId);
  const activeLocationFilter = locations.find(location => location.id === filters.locationId);
  
  const activeFilterCount = [
    filters.status !== 'all' && filters.status,
    filters.courseId,
    filters.locationId,
    (filters.dateRange.from || filters.dateRange.to)
  ].filter(Boolean).length;

  const handleStatusChange = (status: string) => {
    onFilterChange({ status: status as 'all' | 'ACTIVE' | 'ARCHIVED' | 'PROCESSING' });
  };

  const handleCourseChange = (courseId: string) => {
    onFilterChange({ courseId: courseId === 'all' ? null : courseId });
  };

  const handleLocationChange = (locationId: string) => {
    onFilterChange({ locationId: locationId === 'all' ? null : locationId });
  };

  const handleDateRangeSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // If from date is not set, set it
    if (!filters.dateRange.from) {
      onFilterChange({ dateRange: { ...filters.dateRange, from: formattedDate } });
      return;
    }
    
    // If from date is set and the new date is before it, set it as the from date
    const fromDate = new Date(filters.dateRange.from);
    if (date < fromDate) {
      onFilterChange({ dateRange: { from: formattedDate, to: filters.dateRange.from } });
      return;
    }
    
    // Otherwise, set it as the to date
    onFilterChange({ dateRange: { ...filters.dateRange, to: formattedDate } });
    
    // Close the date picker if both dates are set
    if (filters.dateRange.from) {
      setDatePickerOpen(false);
    }
  };

  const handleClearDateRange = () => {
    onFilterChange({ dateRange: { from: null, to: null } });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search rosters..."
          className="pl-8"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
      </div>
      
      <div className="flex flex-wrap md:flex-nowrap gap-2">
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full md:w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.courseId || 'all'} onValueChange={handleCourseChange}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.locationId || 'all'} onValueChange={handleLocationChange}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(location => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto gap-2">
              <Calendar className="h-4 w-4" />
              {!filters.dateRange.from && !filters.dateRange.to ? (
                "Date Range"
              ) : (
                <span className="text-xs truncate">
                  {filters.dateRange.from ? format(new Date(filters.dateRange.from), 'MMM d') : ''}
                  {filters.dateRange.from && filters.dateRange.to ? ' - ' : ''}
                  {filters.dateRange.to ? format(new Date(filters.dateRange.to), 'MMM d, yyyy') : ''}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">Select date range</p>
                {(filters.dateRange.from || filters.dateRange.to) && (
                  <Button variant="ghost" size="sm" onClick={handleClearDateRange}>
                    Clear
                  </Button>
                )}
              </div>
              <CalendarComponent
                mode="single"
                selected={filters.dateRange.from ? new Date(filters.dateRange.from) : undefined}
                onSelect={handleDateRangeSelect}
                className="border rounded-md"
              />
            </div>
          </PopoverContent>
        </Popover>
        
        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={onResetFilters} className="gap-1">
            <X className="h-4 w-4" />
            Clear filters
            <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
