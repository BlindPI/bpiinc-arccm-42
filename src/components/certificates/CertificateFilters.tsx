
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { CertificateFilters as FiltersType } from '@/types/certificateFilters';
import { fetchCertificateCourses } from '@/services/certificates/simpleCertificateService';
import { X, Search, Filter } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

interface CertificateFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onResetFilters: () => void;
  batches?: { id: string; name: string }[];
}

export function CertificateFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  batches = []
}: CertificateFiltersProps) {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['certificate-courses'],
    queryFn: fetchCertificateCourses
  });
  
  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };
  
  const handleCourseChange = (value: string) => {
    onFiltersChange({ ...filters, courseId: value });
  };
  
  const handleBatchChange = (value: string | null) => {
    onFiltersChange({ ...filters, batchId: value });
  };
  
  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: range || {}
    });
  };
  
  const hasActiveFilters = filters.courseId !== 'all' || 
                          filters.status !== 'all' || 
                          filters.batchId !== null || 
                          filters.dateRange.from !== undefined || 
                          filters.dateRange.to !== undefined;
  
  return (
    <Card className="p-4 space-y-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Filter Certificates</h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onResetFilters}
            className="ml-auto h-8 gap-1 text-xs"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Course</label>
          <Select 
            value={filters.courseId} 
            onValueChange={handleCourseChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Status</label>
          <Select 
            value={filters.status} 
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="REVOKED">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {batches && batches.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Roster/Batch</label>
            <Select 
              value={filters.batchId || ''} 
              onValueChange={(value) => handleBatchChange(value === '' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Date Range</label>
          <DateRangePicker
            value={{
              from: filters.dateRange.from,
              to: filters.dateRange.to
            }}
            onChange={handleDateRangeChange}
            align="start"
            showCompare={false}
          />
        </div>
      </div>
    </Card>
  );
}
