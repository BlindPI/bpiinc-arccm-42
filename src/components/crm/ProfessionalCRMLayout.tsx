
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Users, 
  Target, 
  Building, 
  TrendingUp,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CRMGlobalSearch } from './search/CRMGlobalSearch';
import { LeadsListView } from './leads/LeadsListView';
import { ContactsListView } from './contacts/ContactsListView';
import { AccountsListView } from './accounts/AccountsListView';
import { OpportunitiesListView } from './opportunities/OpportunitiesListView';
import { CRMStatsCards } from './dashboard/CRMStatsCards';

export function ProfessionalCRMLayout() {
  const [activeTab, setActiveTab] = useState('leads');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Customer Relationship Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your sales pipeline and customer relationships</p>
            </div>
            <div className="flex items-center gap-3">
              <CRMGlobalSearch />
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <CRMStatsCards />
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="leads" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Leads
                </TabsTrigger>
                <TabsTrigger value="contacts" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="accounts" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Accounts
                </TabsTrigger>
                <TabsTrigger value="opportunities" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Opportunities
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="leads" className="mt-0">
                <LeadsListView />
              </TabsContent>
              
              <TabsContent value="contacts" className="mt-0">
                <ContactsListView />
              </TabsContent>
              
              <TabsContent value="accounts" className="mt-0">
                <AccountsListView />
              </TabsContent>
              
              <TabsContent value="opportunities" className="mt-0">
                <OpportunitiesListView />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
