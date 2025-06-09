
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Support both TanStack Table ColumnDef and our custom Column interface
interface BaseColumn<T> {
  accessorKey: keyof T;
  header: string;
  cell?: ({ row }: { row: { original: T } }) => React.ReactNode;
}

interface TanStackColumn<T> {
  id?: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: ({ row }: { row: { original: T } }) => React.ReactNode;
}

// Union type to support both column formats
export type Column<T> = BaseColumn<T> | TanStackColumn<T>;

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
}

function isBaseColumn<T>(column: Column<T>): column is BaseColumn<T> {
  return 'accessorKey' in column && column.accessorKey !== undefined;
}

export function DataTable<T>({ columns, data, loading }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={isBaseColumn(column) ? String(column.accessorKey) : column.id || index}>
                {typeof column.header === 'string' ? column.header : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.length ? (
            data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column, colIndex) => (
                  <TableCell key={isBaseColumn(column) ? String(column.accessorKey) : column.id || colIndex}>
                    {column.cell 
                      ? column.cell({ row: { original: row } })
                      : isBaseColumn(column) 
                        ? String((row as any)[column.accessorKey] || '')
                        : column.accessorKey 
                          ? String((row as any)[column.accessorKey] || '')
                          : ''
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
