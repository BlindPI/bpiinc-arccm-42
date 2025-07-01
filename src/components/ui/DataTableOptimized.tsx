
import React, { useMemo, useState, useCallback } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Search, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableOptimizedProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  pageSize?: number;
  searchable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
  bulkActions?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function DataTableOptimized<TData, TValue>({
  columns,
  data,
  isLoading = false,
  pageSize = 50,
  searchable = true,
  selectable = false,
  onSelectionChange,
  bulkActions,
  emptyMessage = "No data available.",
  className,
}: DataTableOptimizedProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  // Optimize columns with selection if needed
  const optimizedColumns = useMemo(() => {
    if (!selectable) return columns;

    const selectColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectColumn, ...columns];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: optimizedColumns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Handle selection changes
  const selectedRows = useMemo(() => {
    return table.getFilteredSelectedRowModel().rows.map(row => row.original);
  }, [table, rowSelection]);

  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRows);
    }
  }, [selectedRows, onSelectionChange]);

  const renderSkeleton = useCallback(() => (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {optimizedColumns.map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  ), [optimizedColumns]);

  if (isLoading) {
    return renderSkeleton();
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          )}
          {selectable && selectedRows.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedRows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
            </div>
          )}
        </div>

        {bulkActions && selectedRows.length > 0 && (
          <div className="flex items-center space-x-2">
            {bulkActions}
          </div>
        )}
      </div>

      {/* Table */}
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={optimizedColumns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} entries
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
