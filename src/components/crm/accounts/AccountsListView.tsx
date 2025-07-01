
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Building,
  DollarSign,
  Users,
  Globe
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { AccountDetailModal } from './AccountDetailModal';
import { CreateAccountModal } from './CreateAccountModal';
import type { Account } from '@/types/crm';

export function AccountsListView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['crm-accounts'],
    queryFn: () => CRMService.getAccounts()
  });

  const filteredAccounts = accounts.filter(account =>
    account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prospect': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'partner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'competitor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowDetailModal(true);
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowCreateModal(true);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>

        {/* Accounts List */}
        <div className="space-y-2">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No accounts found</p>
              <p className="text-sm">Create your first account to get started</p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </div>
          ) : (
            filteredAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-white"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Building className="h-5 w-5 text-purple-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">
                        {account.account_name}
                      </h3>
                      <Badge className={getTypeColor(account.account_type)}>
                        {account.account_type}
                      </Badge>
                      <Badge className={getStatusColor(account.account_status)}>
                        {account.account_status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {account.industry && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {account.industry}
                        </div>
                      )}
                      {account.company_size && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {account.company_size}
                        </div>
                      )}
                      {account.annual_revenue && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${account.annual_revenue.toLocaleString()}
                        </div>
                      )}
                      {account.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>Created: {new Date(account.created_at).toLocaleDateString()}</span>
                      {account.last_activity_date && (
                        <span>Last Activity: {new Date(account.last_activity_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewAccount(account)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Account
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateAccountModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        account={selectedAccount}
        onSuccess={() => {
          setShowCreateModal(false);
          setSelectedAccount(null);
        }}
      />

      <AccountDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        account={selectedAccount}
      />
    </>
  );
}
