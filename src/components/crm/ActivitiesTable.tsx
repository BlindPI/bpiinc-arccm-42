
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { ActivitiesService } from '@/services/crm/activitiesService';
import { ColumnDef } from '@tanstack/react-table';
import { Activity } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { adaptColumns } from '@/utils/dataTableAdapter';

const tanstackColumns: ColumnDef<Activity>[] = [
  {
    accessorKey: 'subject',
    header: 'Subject',
  },
  {
    accessorKey: 'activity_type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue('activity_type') as string}
      </Badge>
    ),
  },
  {
    accessorKey: 'activity_date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.getValue('activity_date') as string;
      return format(new Date(date), 'MMM dd, yyyy');
    },
  },
  {
    accessorKey: 'completed',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.getValue('completed') ? 'default' : 'secondary'}>
        {row.getValue('completed') ? 'Completed' : 'Pending'}
      </Badge>
    ),
  },
];

export function ActivitiesTable() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['crm-activities'],
    queryFn: () => ActivitiesService.getActivities()
  });

  // Convert TanStack columns to our DataTable format
  const columns = adaptColumns(tanstackColumns);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={activities}
          loading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
