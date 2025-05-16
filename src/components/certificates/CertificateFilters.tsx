
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CourseSelector } from './CourseSelector';
import { Calendar, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DateRange, CertificateFilters as CertFilterType } from '@/types/certificateFilters';

interface CertificateFiltersProps {
  filters: CertFilterType;
  onFiltersChange: (filters: CertFilterType) => void;
  onResetFilters: () => void;
  batches?: { id: string; name: string }[];
}

export function CertificateFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  batches = []
}: CertificateFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState<DateRange>(filters.dateRange);
  
  const handleDateRangeSelect = () => {
    onFiltersChange({
      ...filters,
      dateRange: localDateRange
    });
    setIsDatePickerOpen(false);
  };

  const handleCourseSelect = (courseId: string) => {
    onFiltersChange({
      ...filters,
      courseId
    });
  };

  const handleStatusSelect = (status: string) => {
    onFiltersChange({
      ...filters,
      status
    });
  };
  
  const handleBatchSelect = (batchId: string) => {
    onFiltersChange({
      ...filters,
      batchId: batchId === 'all' ? null : batchId
    });
  };

  const getDateRangeDisplay = () => {
    // Use both from/to and start/end for compatibility
    if ((filters.dateRange.from || filters.dateRange.start) && (filters.dateRange.to || filters.dateRange.end)) {
      const startDate = filters.dateRange.from || filters.dateRange.start;
      const endDate = filters.dateRange.to || filters.dateRange.end;
      return `${format(startDate as Date, 'MMM d, yyyy')} - ${format(endDate as Date, 'MMM d, yyyy')}`;
    } else if (filters.dateRange.from || filters.dateRange.start) {
      const startDate = filters.dateRange.from || filters.dateRange.start;
      return `From ${format(startDate as Date, 'MMM d, yyyy')}`;
    } else if (filters.dateRange.to || filters.dateRange.end) {
      const endDate = filters.dateRange.to || filters.dateRange.end;
      return `Until ${format(endDate as Date, 'MMM d, yyyy')}`;
    }
    return 'All dates';
  };
  
  const hasActiveFilters = filters.courseId !== 'all' || 
    filters.status !== 'all' || 
    filters.batchId !== null ||
    (filters.dateRange.from !== undefined || filters.dateRange.start !== undefined) ||
    (filters.dateRange.to !== undefined || filters.dateRange.end !== undefined);

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border mb-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-medium flex items-center gap-1.5">
          <Filter className="h-4 w-4" />
          Certificate Filters
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onResetFilters} className="h-8 text-xs">
            <X className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <CourseSelector 
          selectedCourseId={filters.courseId}
          onCourseSelect={handleCourseSelect}
          label="Course"
          className="col-span-1"
        />
        
        <div className="space-y-1.5 col-span-1">
          <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
          <Select value={filters.status} onValueChange={handleStatusSelect}>
            <SelectTrigger id="status-filter" className="bg-white dark:bg-secondary">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="REVOKED">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {batches && batches.length > 0 && (
          <div className="space-y-1.5 col-span-1">
            <label htmlFor="batch-filter" className="text-sm font-medium">Roster/Batch</label>
            <Select value={filters.batchId || 'all'} onValueChange={handleBatchSelect}>
              <SelectTrigger id="batch-filter" className="bg-white dark:bg-secondary">
                <SelectValue placeholder="All batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-1.5 col-span-1">
          <label className="text-sm font-medium">Date Range</label>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-white">
                <Calendar className="mr-2 h-4 w-4" />
                {getDateRangeDisplay()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Date Range</h4>
                  <p className="text-xs text-muted-foreground">
                    Select a date range to filter certificates
                  </p>
                </div>
              </div>
              <div className="p-3">
                <div className="flex gap-2">
                  <div className="grid gap-2">
                    <label className="text-xs">From</label>
                    <Input
                      type="date"
                      value={localDateRange.from ? format(localDateRange.from, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        setLocalDateRange(prev => ({ ...prev, from: date, start: date }));
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs">To</label>
                    <Input
                      type="date"
                      value={localDateRange.to ? format(localDateRange.to, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        setLocalDateRange(prev => ({ ...prev, to: date, end: date }));
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setLocalDateRange({});
                      setIsDatePickerOpen(false);
                      onFiltersChange({
                        ...filters,
                        dateRange: {}
                      });
                    }}
                  >
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleDateRangeSelect}>
                    Apply Range
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
