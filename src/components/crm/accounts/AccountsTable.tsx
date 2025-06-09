
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableOptimized } from '@/components/ui/DataTableOptimized';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Trash2, Plus, Building2, DollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CRMService } from '@/services/crm/crmService';
import type { Account } from '@/types/crm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { AccountForm } from './AccountForm';

const typeColors = {
  prospect: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  partner: 'bg-purple-100 text-purple-800',
  competitor: 'bg-red-100 text-red-800'
};

export const AccountsTable: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', { account_type: typeFilter !== 'all' ? typeFilter : undefined }],
    queryFn: () => CRMService.getAccounts({
      account_type: typeFilter !== 'all' ? typeFilter : undefined
    })
  });

  const deleteMutation = useMutation({
    mutationFn: CRMService.deleteAccount,
    onSuccess: () => {
      toast.success('Account deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: () => {
      toast.error('Failed to delete account');
    }
  });

  const filteredAccounts = accounts?.filter(account => {
    const matchesSearch = !searchTerm || 
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.industry && account.industry.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: 'account_name',
      header: 'Account Name',
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{account.account_name}</div>
              {account.company_size && (
                <div className="text-sm text-muted-foreground">{account.company_size}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'account_type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('account_type') as string;
        return (
          <Badge className={typeColors[type as keyof typeof typeColors]}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'industry',
      header: 'Industry',
      cell: ({ row }) => {
        const industry = row.getValue('industry') as string;
        return industry || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'annual_revenue',
      header: 'Annual Revenue',
      cell: ({ row }) => {
        const revenue = row.getValue('annual_revenue') as number;
        return revenue ? (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            {formatCurrency(revenue)}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string;
        return phone || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'website',
      header: 'Website',
      cell: ({ row }) => {
        const website = row.getValue('website') as string;
        return website ? (
          <a 
            href={website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {website}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return formatDate(date);
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const account = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedAccount(account);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this account?')) {
                    deleteMutation.mutate(account.id);
                  }
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleAccountSaved = () => {
    setIsFormOpen(false);
    setSelectedAccount(null);
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="competitor">Competitor</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedAccount(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount ? 'Edit Account' : 'Create New Account'}
              </DialogTitle>
            </DialogHeader>
            <AccountForm 
              account={selectedAccount}
              onSave={handleAccountSaved}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTableOptimized
        columns={columns}
        data={filteredAccounts || []}
        isLoading={isLoading}
        searchable={false}
        emptyMessage="No accounts found. Create your first account to get started."
      />
    </div>
  );
};
