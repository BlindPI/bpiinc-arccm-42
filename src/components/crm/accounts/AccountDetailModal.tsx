
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, Edit, Globe, Phone, DollarSign } from 'lucide-react';
import { AccountOverviewTab } from './AccountOverviewTab';
import { AccountContactsTab } from './AccountContactsTab';
import { AccountOpportunitiesTab } from './AccountOpportunitiesTab';
import { CreateAccountModal } from './CreateAccountModal';
import type { Account } from '@/types/crm';

interface AccountDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export function AccountDetailModal({ open, onOpenChange, account }: AccountDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  if (!account) return null;

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
                
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {account.account_name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getTypeColor(account.account_type)}>
                      {account.account_type}
                    </Badge>
                    <Badge className={getStatusColor(account.account_status)}>
                      {account.account_status}
                    </Badge>
                    {account.industry && (
                      <span className="text-sm text-gray-500">{account.industry}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>

            {/* Quick Account Info */}
            <div className="flex items-center gap-6 mt-4 text-sm">
              {account.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {account.website}
                  </a>
                </div>
              )}
              {account.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{account.phone}</span>
                </div>
              )}
              {account.annual_revenue && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>${account.annual_revenue.toLocaleString()} annual revenue</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <AccountOverviewTab account={account} />
              </TabsContent>
              
              <TabsContent value="contacts" className="mt-6">
                <AccountContactsTab accountId={account.id} />
              </TabsContent>
              
              <TabsContent value="opportunities" className="mt-6">
                <AccountOpportunitiesTab accountId={account.id} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <CreateAccountModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        account={account}
        onSuccess={() => {
          setShowEditModal(false);
        }}
      />
    </>
  );
}
