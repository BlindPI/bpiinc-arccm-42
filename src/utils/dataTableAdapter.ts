
import { ColumnDef } from '@tanstack/react-table';
import { Column } from '@/components/ui/data-table';

// Adapter function to convert TanStack columns to our custom DataTable columns
export function adaptColumns<T>(columns: ColumnDef<T>[]): Column<T>[] {
  return columns.map(col => ({
    id: col.id || String(col.accessorKey),
    accessorKey: col.accessorKey as keyof T,
    header: typeof col.header === 'function' ? col.header({} as any) : col.header,
    cell: col.cell ? ({ row }) => col.cell!({ row: { original: row.original } } as any) : undefined
  }));
}
