import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Target, 
  DollarSign, 
  TrendingUp,
  Search,
  Filter,
  Plus,
  Menu
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EnhancedCRMService } from '@/services/crm/enhancedCRMService';
import { LeadsTable } from '@/components/crm/LeadsTable';
import { LeadPipeline } from '@/components/crm/LeadPipeline';
import { OpportunityPipeline } from '@/components/crm/OpportunityPipeline';
import { ContactsTable } from '@/components/crm/contacts/ContactsTable';
import { AccountsTable } from '@/components/crm/accounts/AccountsTable';
import { ActivitiesTable } from '@/components/crm/ActivitiesTable';
import { LeadDetailView } from '../leads/LeadDetailView';
import { convertCRMContactToContact } from '@/utils/crmTypeConverters';
import { useCRMContacts } from '@/hooks/useCRMContacts';

// Helper function to convert CRMContact to Contact type
const convertCRMContactToContact = (crmContact: CRMContact) => ({
  ...crmContact,
  contact_status: (crmContact.contact_status === 'active' || crmContact.contact_status === 'inactive') 
    ? crmContact.contact_status 
    : 'active' as 'active' | 'inactive'
});

export function ResponsiveCRMDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: crmStats } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => EnhancedCRMService.getCRMStats()
  });

  const { data: revenueMetrics } = useQuery({
    queryKey: ['revenue-metrics'],
    queryFn: () => EnhancedCRMService.getRevenueMetrics({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    })
  });

  const { data: crmContacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => EnhancedCRMService.getContacts()
  });

  // Use the CRM contacts hook for proper contact management
  const { contacts: managedContacts, onCreateContact, onUpdateContact, onDeleteContact } = useCRMContacts();

  // Convert CRMContact[] to Contact[] for the ContactsTable
  const contacts = crmContacts.map(convertCRMContactToContact);

  const tabItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: Target },
    { id: 'opportunities', label: 'Opportunities', icon: DollarSign },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'activities', label: 'Activities', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-semibold">CRM Dashboard</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b p-4">
            <div className="grid grid-cols-2 gap-2">
              {tabItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white border-r min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">CRM Dashboard</h2>
            <nav className="space-y-2">
              {tabItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Search and Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search CRM data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{crmStats?.totalContacts || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{crmStats?.totalOpportunities || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(revenueMetrics?.currentRevenue || 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{crmStats?.conversionRate || 0}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Pipeline Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lead Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LeadPipeline />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OpportunityPipeline />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <Card>
              <CardHeader>
                <CardTitle>Lead Management</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadsTable onLeadSelect={setSelectedLeadId} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'pipeline' && (
            <Card>
              <CardHeader>
                <CardTitle>Lead Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadPipeline />
              </CardContent>
            </Card>
          )}

          {activeTab === 'opportunities' && (
            <Card>
              <CardHeader>
                <CardTitle>Opportunities Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <OpportunityPipeline />
              </CardContent>
            </Card>
          )}

          {activeTab === 'contacts' && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactsTable 
                  contacts={managedContacts}
                  isLoading={contactsLoading}
                  onCreateContact={onCreateContact}
                  onUpdateContact={onUpdateContact}
                  onDeleteContact={onDeleteContact}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'accounts' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
              </CardHeader>
              <CardContent>
                <AccountsTable />
              </CardContent>
            </Card>
          )}

          {activeTab === 'activities' && (
            <Card>
              <CardHeader>
                <CardTitle>Activities Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivitiesTable />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLeadId && (
        <LeadDetailView
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
