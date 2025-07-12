import React, { useState, useMemo, useEffect } from 'react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type VisibilityState } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Search, Filter, Download, Plus, ChevronUp, ChevronDown, Columns, ArrowUpDown, FileText, CheckCircle, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { StudentProfile, StudentFilters, PaginationParams } from '@/hooks/useStudentManagement';

interface StudentDataTableProps {
  data: StudentProfile[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: StudentFilters;
  isLoading: boolean;
  onFiltersChange: (filters: StudentFilters) => void;
  onPaginationChange: (pagination: PaginationParams) => void;
  onStudentEdit: (student: StudentProfile) => void;
  onStudentDelete: (studentId: string) => void;
  onBulkAction: (action: string, studentIds: string[]) => void;
  onImportClick: () => void;
  onExport: () => void;
}

export function StudentDataTable({
  data,
  totalCount,
  currentPage,
  pageSize,
  filters,
  isLoading,
  onFiltersChange,
  onPaginationChange,
  onStudentEdit,
  onStudentDelete,
  onBulkAction,
  onImportClick,
  onExport
}: StudentDataTableProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [enrollmentSortType, setEnrollmentSortType] = useState<'alphabetical' | 'course_type' | 'provider' | null>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('studentTable_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.columnVisibility) {
          setColumnVisibility(config.columnVisibility);
        }
        if (config.sortBy && config.sortOrder && !filters.sortBy) {
          onFiltersChange({ 
            ...filters, 
            sortBy: config.sortBy, 
            sortOrder: config.sortOrder 
          });
        }
      } catch (error) {
        console.warn('Failed to load table configuration:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    const config = {
      columnVisibility,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };
    localStorage.setItem('studentTable_config', JSON.stringify(config));
  }, [columnVisibility, filters.sortBy, filters.sortOrder]);

  const handleSort = (columnId: string) => {
    const currentSortBy = filters.sortBy;
    const currentSortOrder = filters.sortOrder;
    
    let newSortOrder: 'asc' | 'desc' = 'asc';
    if (currentSortBy === columnId && currentSortOrder === 'asc') {
      newSortOrder = 'desc';
    }
    
    onFiltersChange({
      ...filters,
      sortBy: columnId,
      sortOrder: newSortOrder
    });
  };

  const handleEnrollmentSort = (sortType: 'alphabetical' | 'course_type' | 'provider') => {
    setEnrollmentSortType(sortType);
    
    if (sortType === 'alphabetical') {
      // Use backend sorting for alphabetical
      handleSort('enrollments_list');
    } else {
      // For advanced sorting, we'll sort the data client-side
      const currentSortOrder = (filters.sortBy === 'enrollments_list' && filters.sortOrder === 'asc') ? 'desc' : 'asc';
      onFiltersChange({
        ...filters,
        sortBy: 'enrollments_list',
        sortOrder: currentSortOrder
      });
    }
  };

  const handleCertificateSort = () => {
    const currentSortOrder = (filters.sortBy === 'certificates' && filters.sortOrder === 'asc') ? 'desc' : 'asc';
    onFiltersChange({
      ...filters,
      sortBy: 'certificates',
      sortOrder: currentSortOrder
    });
  };

  const sortEnrollmentsData = (data: StudentProfile[], sortType: 'course_type' | 'provider', sortOrder: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const aEnrollments = a.student_metadata?.enrollments_list || '';
      const bEnrollments = b.student_metadata?.enrollments_list || '';
      
      let aValue = '';
      let bValue = '';
      
      if (sortType === 'course_type') {
        // Extract course type (e.g., "Standard First Aid", "CPR")
        aValue = aEnrollments.match(/(Standard First Aid|Emergency First Aid|CPR|First Aid)/i)?.[0] || '';
        bValue = bEnrollments.match(/(Standard First Aid|Emergency First Aid|CPR|First Aid)/i)?.[0] || '';
      } else if (sortType === 'provider') {
        // Extract provider/location (e.g., "Oakville", "ParaCPR", "Unifirst")
        aValue = aEnrollments.split(' ')[0] || '';
        bValue = bEnrollments.split(' ')[0] || '';
      }
      
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const sortCertificatesData = (data: StudentProfile[], sortOrder: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const aCount = a.certificate_count || 0;
      const bCount = b.certificate_count || 0;
      
      const comparison = aCount - bCount;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const getSortIcon = (columnId: string) => {
    if (filters.sortBy !== columnId) return null;
    return filters.sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const columns: ColumnDef<StudentProfile>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            if (value) {
              setSelectedStudents(data.map(student => student.id));
            } else {
              setSelectedStudents([]);
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedStudents.includes(row.original.id)}
          onCheckedChange={(value) => {
            if (value) {
              setSelectedStudents(prev => [...prev, row.original.id]);
            } else {
              setSelectedStudents(prev => prev.filter(id => id !== row.original.id));
            }
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'first_name',
      header: ({ column }) => (
        <Button 
          variant="ghost" 
          onClick={() => handleSort('first_name')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          First Name
          {getSortIcon('first_name')}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.first_name || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'last_name',
      header: ({ column }) => (
        <Button 
          variant="ghost" 
          onClick={() => handleSort('last_name')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Last Name
          {getSortIcon('last_name')}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.last_name || 'N/A'}</div>
      ),
    },
    {
      id: 'date_created',
      header: ({ column }) => (
        <Button 
          variant="ghost" 
          onClick={() => handleSort('created_at')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Date Created
          {getSortIcon('created_at')}
        </Button>
      ),
      cell: ({ row }) => {
        const dateCreated = row.original.student_metadata?.date_created;
        return (
          <div className="text-sm text-muted-foreground">
            {dateCreated ? new Date(dateCreated).toLocaleDateString() : 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button 
          variant="ghost" 
          onClick={() => handleSort('email')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Email
          {getSortIcon('email')}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.email}</div>
      ),
    },
    {
      id: 'certificates',
      header: ({ column }) => (
        <Button 
          variant="ghost" 
          onClick={() => handleCertificateSort()}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Certificates
          <FileText className="h-3 w-3 ml-1" />
          {filters.sortBy === 'certificates' && getSortIcon('certificates')}
        </Button>
      ),
      cell: ({ row }) => {
        const student = row.original;
        const hasCerts = student.has_certificates;
        const count = student.certificate_count || 0;
        const latestDate = student.latest_certificate_date;
        const summary = student.certificate_status_summary;
        
        return (
          <div className="flex items-center space-x-2">
            {/* Certificate Status Indicator */}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              hasCerts ? 'bg-success' : 'bg-muted'
            }`} title={hasCerts ? 'Has Certificates' : 'No Certificates'} />
            
            {/* Certificate Count Badge */}
            {count > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {count}
              </Badge>
            )}
            
            {/* Status Summary */}
            {summary && count > 0 && (
              <div className="flex items-center space-x-1">
                {summary.active > 0 && (
                  <div title={`${summary.active} Active`}>
                    <CheckCircle className="h-3 w-3 text-success" />
                  </div>
                )}
                {summary.pending > 0 && (
                  <div title={`${summary.pending} Pending`}>
                    <Calendar className="h-3 w-3 text-warning" />
                  </div>
                )}
              </div>
            )}
            
            {/* Latest Certificate Date */}
            {latestDate && (
              <div className="text-xs text-muted-foreground" title="Latest Certificate">
                {new Date(latestDate).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'enrollments_list',
      header: ({ column }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 p-0 font-semibold hover:bg-transparent flex items-center"
            >
              Enrollments - List
              <ArrowUpDown className="h-3 w-3 ml-1" />
              {getSortIcon('enrollments_list')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleEnrollmentSort('alphabetical')}>
              Sort Alphabetically
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEnrollmentSort('course_type')}>
              Sort by Course Type
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEnrollmentSort('provider')}>
              Sort by Provider/Location
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      cell: ({ row }) => {
        const enrollmentsList = row.original.student_metadata?.enrollments_list;
        return (
          <div className="text-sm max-w-32 truncate" title={enrollmentsList}>
            {enrollmentsList || 'N/A'}
          </div>
        );
      },
    },
    {
      id: 'referred_by',
      header: 'Referred By',
      cell: ({ row }) => {
        const referredBy = row.original.student_metadata?.referred_by;
        return <div className="text-sm">{referredBy || 'N/A'}</div>;
      },
    },
    {
      id: 'referred_from',
      header: 'Referred From',
      cell: ({ row }) => {
        const referredFrom = row.original.student_metadata?.referred_from;
        return <div className="text-sm">{referredFrom || 'N/A'}</div>;
      },
    },
    {
      accessorKey: 'enrollment_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.enrollment_status;
        const variant = status === 'ACTIVE' ? 'default' : 
                      status === 'INACTIVE' ? 'secondary' : 
                      status === 'SUSPENDED' ? 'destructive' : 'outline';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStudentEdit(row.original)}>
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStudentDelete(row.original.id)} className="text-destructive">
              Delete Student
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [data, selectedStudents, onStudentEdit, onStudentDelete]);

  // Apply client-side sorting for advanced enrollment sorting and certificate sorting
  const sortedData = useMemo(() => {
    if (filters.sortBy === 'enrollments_list' && enrollmentSortType && enrollmentSortType !== 'alphabetical') {
      return sortEnrollmentsData(data, enrollmentSortType, filters.sortOrder || 'asc');
    }
    if (filters.sortBy === 'certificates') {
      return sortCertificatesData(data, filters.sortOrder || 'asc');
    }
    return data;
  }, [data, filters.sortBy, filters.sortOrder, enrollmentSortType]);

  const table = useReactTable({
    data: sortedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusFilter = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      enrollment_status: value === 'all' ? undefined : value 
    });
  };

  const handleSourceFilter = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      imported_from: value === 'all' ? undefined : value 
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select value={filters.enrollment_status || 'all'} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.imported_from || 'all'} onValueChange={handleSourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="CSV_IMPORT">CSV Import</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
              <SelectItem value="API">API</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          {selectedStudents.length > 0 && (
            <Select onValueChange={(value) => onBulkAction(value, selectedStudents)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Bulk Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activate">Activate</SelectItem>
                <SelectItem value="deactivate">Deactivate</SelectItem>
                <SelectItem value="suspend">Suspend</SelectItem>
                <SelectItem value="export">Export Selected</SelectItem>
              </SelectContent>
            </Select>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === 'first_name' ? 'First Name' :
                       column.id === 'last_name' ? 'Last Name' :
                       column.id === 'date_created' ? 'Date Created' :
                       column.id === 'certificates' ? 'Certificates' :
                       column.id === 'enrollments_list' ? 'Enrollments' :
                       column.id === 'referred_by' ? 'Referred By' :
                       column.id === 'referred_from' ? 'Referred From' :
                       column.id === 'enrollment_status' ? 'Status' :
                       column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={onImportClick}>
            <Plus className="h-4 w-4 mr-2" />
            Import Students
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedStudents.length > 0 && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm font-medium">
            {selectedStudents.length} student(s) selected
          </p>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} students
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange({ page: currentPage - 1, pageSize })}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPaginationChange({ page: pageNum, pageSize })}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange({ page: currentPage + 1, pageSize })}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}