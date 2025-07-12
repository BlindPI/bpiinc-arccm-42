import React, { useState, useMemo } from 'react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Search, Filter, Download, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
      accessorKey: 'external_student_id',
      header: 'ID',
      cell: ({ row }) => (
        <div className="text-sm font-mono">{row.original.external_student_id || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'first_name',
      header: 'First Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.first_name || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'last_name',
      header: 'Last Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.last_name || 'N/A'}</div>
      ),
    },
    {
      id: 'amount_spent',
      header: 'Amount Spent',
      cell: ({ row }) => {
        const amount = row.original.student_metadata?.amount_spent;
        return <div className="text-sm">{amount || '$0'}</div>;
      },
    },
    {
      id: 'date_created',
      header: 'Date Created',
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
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.email}</div>
      ),
    },
    {
      id: 'enrollments',
      header: 'Enrollments',
      cell: ({ row }) => {
        const enrollments = row.original.student_metadata?.enrollments || 0;
        return <div className="text-center">{enrollments}</div>;
      },
    },
    {
      id: 'enrollments_list',
      header: 'Enrollments - List',
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
      id: 'external_source',
      header: 'External Source',
      cell: ({ row }) => {
        const externalSource = row.original.student_metadata?.external_source;
        return <div className="text-sm">{externalSource || 'N/A'}</div>;
      },
    },
    {
      id: 'last_sign_in',
      header: 'Last Sign In',
      cell: ({ row }) => {
        const lastSignIn = row.original.student_metadata?.last_sign_in;
        return (
          <div className="text-sm text-muted-foreground">
            {lastSignIn ? new Date(lastSignIn).toLocaleDateString() : 'Never'}
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
      id: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        const roles = row.original.student_metadata?.roles;
        return <Badge variant="outline">{roles || 'Student'}</Badge>;
      },
    },
    {
      id: 'sign_in_count',
      header: 'Sign In Count',
      cell: ({ row }) => {
        const signInCount = row.original.student_metadata?.sign_in_count || 0;
        return <div className="text-center">{signInCount}</div>;
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
      id: 'country',
      header: 'Country',
      cell: ({ row }) => {
        const country = row.original.student_metadata?.country;
        return <div className="text-sm">{country || 'N/A'}</div>;
      },
    },
    {
      id: 'postal_code',
      header: 'Postal Code',
      cell: ({ row }) => {
        const postalCode = row.original.student_metadata?.postal_code;
        return <div className="text-sm">{postalCode || 'N/A'}</div>;
      },
    },
    {
      id: 'region',
      header: 'Region',
      cell: ({ row }) => {
        const region = row.original.student_metadata?.region;
        return <div className="text-sm">{region || 'N/A'}</div>;
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
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
      <div className="rounded-md border">
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