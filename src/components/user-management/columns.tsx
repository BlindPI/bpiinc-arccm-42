
import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UserActions } from './UserActions';
import { ROLE_LABELS } from '@/lib/roles';
import { ExtendedUser } from '@/types/courses';

export const columns: ColumnDef<ExtendedUser>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
  },
  {
    accessorKey: 'display_name',
    header: 'Name',
    cell: ({ row }) => <div className="font-medium">{row.original.display_name || 'Unnamed User'}</div>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div>{row.original.email || 'No email'}</div>,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.original.role;
      return <Badge variant="outline">{ROLE_LABELS[role] || role}</Badge>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status || 'INACTIVE';
      return (
        <Badge
          variant={status === 'ACTIVE' ? 'success' : status === 'PENDING' ? 'warning' : 'outline'}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'compliance_status',
    header: 'Compliance',
    cell: ({ row }) => {
      const complianceStatus = row.original.compliance_status;
      return (
        <Badge
          variant={complianceStatus ? 'success' : 'destructive'}
        >
          {complianceStatus ? 'Compliant' : 'Non-compliant'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => <div>{new Date(row.original.created_at).toLocaleDateString()}</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];
