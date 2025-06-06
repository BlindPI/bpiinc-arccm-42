import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableOptimized } from '@/components/ui/DataTableOptimized';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Eye,
  Mail,
  Phone,
  Globe,
  MapPin
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CRMService, Account } from '@/services/crm/crmService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { AccountForm } from './AccountForm';
import { AccountProfile } from './AccountProfile';

const accountTypeColors = {
  prospect: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  partner: 'bg-purple-100 text-purple-800',
  competitor: 'bg-red-100 text-red-800'
};

const accountStatusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800'
};

interface AccountsTableProps {
  className?: string;
}

export const AccountsTable: React.FC<AccountsTableProps> = ({ className }) => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileAccount, setProfileAccount] = useState<Account | null>(null);
  const [filters, setFilters] = useState({
    account_type: 'all',
    industry: 'all',
    account_status: 'all',
    assigned_to: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', filters],
    queryFn: () => CRMService.getAccounts({
      ...(filters.account_type !== 'all' && { account_type: filters.account_type }),
      ...(filters.industry !== 'all' && { industry: filters.industry }),
      ...(filters.assigned_to !== 'all' && { assigned_to: filters.assigned_to })
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

  // Filter accounts based on search query
  const filteredAccounts = accounts?.filter(account => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      account.account_name.toLowerCase().includes(query) ||
      account.industry?.toLowerCase().includes(query) ||
      account.website?.toLowerCase().includes(query)
    );
  }) || [];

  const handleViewAccount = (account: Account) => {
    setProfileAccount(account);
    setIsProfileOpen(true);
  };

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: 'account_name',
      header: 'Account',
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm">{account.account_name}</div>
              <div className="text-xs text-muted-foreground">
                {account.industry || 'No industry specified'}
              </div>
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
          <Badge className={accountTypeColors[type as keyof typeof accountTypeColors]}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'company_size',
      header: 'Size',
      cell: ({ row }) => {
        const size = row.getValue('company_size') as string;
        return size ? (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{size}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not specified</span>
        );
      },
    },
    {
      accessorKey: 'annual_revenue',
      header: 'Revenue',
      cell: ({ row }) => {
        const revenue = row.getValue('annual_revenue') as number;
        return revenue ? (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">{formatCurrency(revenue)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not specified</span>
        );
      },
    },
    {
      accessorKey: 'account_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('account_status') as string;
        return (
          <Badge className={accountStatusColors[status as keyof typeof accountStatusColors]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'website',
      header: 'Contact',
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="space-y-1">
            {account.website && (
              <div className="flex items-center gap-1 text-xs">
                <Globe className="h-3 w-3" />
                <a 
                  href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {account.website}
                </a>
              </div>
            )}
            {account.phone && (
              <div className="flex items-center gap-1 text-xs">
                <Phone className="h-3 w-3" />
                <span>{account.phone}</span>
              </div>
            )}
            {account.billing_address && (
              <div className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                <span>{account.billing_address}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.getValue('created_at'))}
        </span>
      ),
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
              <DropdownMenuItem onClick={() => handleViewAccount(account)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
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
                onClick={() => deleteMutation.mutate(account.id)}
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

  // Get unique industries for filter
  const industries = [...new Set(accounts?.map(a => a.industry).filter(Boolean))] || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts?.filter(a => a.account_type === 'customer' && a.account_status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(accounts?.reduce((sum, a) => sum + (a.annual_revenue || 0), 0) || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts?.filter(a => a.account_type === 'prospect').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Input
          placeholder="Search accounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={filters.account_type} onValueChange={(value) => setFilters({...filters, account_type: value})}>
          <SelectTrigger className="w-40">
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
        
        <Select value={filters.industry} onValueChange={(value) => setFilters({...filters, industry: value})}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map(industry => (
              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.account_status} onValueChange={(value) => setFilters({...filters, account_status: value})}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedAccount(null)}>
              <Building2 className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
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
        data={filteredAccounts}
        isLoading={isLoading}
        searchable={false}
        emptyMessage="No accounts found. Start by adding your first account."
      />

      {/* Account Profile Modal */}
      {profileAccount && (
        <AccountProfile
          account={profileAccount}
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            setProfileAccount(null);
          }}
          onEdit={() => {
            setSelectedAccount(profileAccount);
            setIsProfileOpen(false);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
};