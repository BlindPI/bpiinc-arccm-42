
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { AccountsService } from '@/services/crm/accountsService';
import { ColumnDef } from '@tanstack/react-table';
import { Account } from '@/types/crm';
import { Badge } from '@/components/ui/badge';

const columns: ColumnDef<Account>[] = [
  {
    accessorKey: 'account_name',
    header: 'Account Name',
  },
  {
    accessorKey: 'account_type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue('account_type') as string}
      </Badge>
    ),
  },
  {
    accessorKey: 'industry',
    header: 'Industry',
  },
  {
    accessorKey: 'account_status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.getValue('account_status') === 'active' ? 'default' : 'secondary'}>
        {row.getValue('account_status') as string}
      </Badge>
    ),
  },
];

export function AccountsTable() {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['crm-accounts'],
    queryFn: () => AccountsService.getAccounts()
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={accounts}
          loading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
