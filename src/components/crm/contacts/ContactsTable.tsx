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
  Users, 
  Mail, 
  Phone, 
  Building2,
  Eye,
  UserPlus,
  Activity,
  Calendar,
  MessageSquare,
  PhoneCall,
  Ban
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CRMService, Contact } from '@/services/crm/crmService';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ContactForm } from './ContactForm';
import { ContactProfile } from './ContactProfile';

const contactStatusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  bounced: 'bg-red-100 text-red-800'
};

const contactMethodColors = {
  email: 'bg-blue-100 text-blue-800',
  phone: 'bg-purple-100 text-purple-800',
  mobile: 'bg-orange-100 text-orange-800'
};

interface ContactsTableProps {
  className?: string;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({ className }) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileContact, setProfileContact] = useState<Contact | null>(null);
  const [filters, setFilters] = useState({
    contact_status: 'all',
    lead_source: 'all',
    account_id: 'all',
    preferred_contact_method: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => CRMService.getContacts({
      ...(filters.contact_status !== 'all' && { contact_status: filters.contact_status }),
      ...(filters.lead_source !== 'all' && { lead_source: filters.lead_source }),
      ...(filters.account_id !== 'all' && { account_id: filters.account_id })
    })
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => CRMService.getAccounts()
  });

  const deleteMutation = useMutation({
    mutationFn: CRMService.deleteContact,
    onSuccess: () => {
      toast.success('Contact deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast.error('Failed to delete contact');
    }
  });

  // Filter contacts based on search query
  const filteredContacts = contacts?.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.first_name.toLowerCase().includes(query) ||
      contact.last_name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.title?.toLowerCase().includes(query) ||
      contact.department?.toLowerCase().includes(query)
    );
  }) || [];

  const handleViewContact = (contact: Contact) => {
    setProfileContact(contact);
    setIsProfileOpen(true);
  };

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: 'first_name',
      header: 'Contact',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm">
                {contact.first_name} {contact.last_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {contact.title && `${contact.title}`}
                {contact.department && ` • ${contact.department}`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Contact Info',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3" />
              <span>{contact.email}</span>
              {contact.do_not_email && (
                <span title="Do not email">
                  <Ban className="h-3 w-3 text-red-500" />
                </span>
              )}
            </div>
            {contact.phone && (
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-3 w-3" />
                <span>{contact.phone}</span>
                {contact.do_not_call && (
                  <span title="Do not call">
                    <Ban className="h-3 w-3 text-red-500" />
                  </span>
                )}
              </div>
            )}
            {contact.mobile_phone && (
              <div className="flex items-center gap-1 text-sm">
                <PhoneCall className="h-3 w-3" />
                <span>{contact.mobile_phone}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'account_id',
      header: 'Account',
      cell: ({ row }) => {
        const contact = row.original;
        const account = accounts?.find(acc => acc.id === contact.account_id);
        return account ? (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{account.account_name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No account</span>
        );
      },
    },
    {
      accessorKey: 'contact_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('contact_status') as string;
        return (
          <Badge className={contactStatusColors[status as keyof typeof contactStatusColors]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'preferred_contact_method',
      header: 'Preferred Method',
      cell: ({ row }) => {
        const method = row.getValue('preferred_contact_method') as string;
        return (
          <Badge variant="outline" className={contactMethodColors[method as keyof typeof contactMethodColors]}>
            {method.charAt(0).toUpperCase() + method.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lead_source',
      header: 'Source',
      cell: ({ row }) => {
        const source = row.getValue('lead_source') as string;
        return (
          <span className="text-sm">
            {source.replace('_', ' ').toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: 'last_activity_date',
      header: 'Last Activity',
      cell: ({ row }) => {
        const date = row.getValue('last_activity_date') as string;
        return date ? (
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(date)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No activity</span>
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
        const contact = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewContact(contact)}>
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedContact(contact);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                disabled={contact.do_not_email}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                disabled={contact.do_not_call || !contact.phone}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate(contact.id)}
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

  const handleContactSaved = () => {
    setIsFormOpen(false);
    setSelectedContact(null);
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  // Get unique lead sources for filter
  const leadSources = [...new Set(contacts?.map(c => c.lead_source).filter(Boolean))] || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts?.filter(c => c.contact_status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts?.filter(c => c.account_id).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts?.filter(c => {
                if (!c.last_activity_date) return false;
                const activityDate = new Date(c.last_activity_date);
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                return activityDate >= thirtyDaysAgo;
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={filters.contact_status} onValueChange={(value) => setFilters({...filters, contact_status: value})}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.lead_source} onValueChange={(value) => setFilters({...filters, lead_source: value})}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {leadSources.map(source => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.preferred_contact_method} onValueChange={(value) => setFilters({...filters, preferred_contact_method: value})}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
          </SelectContent>
        </Select>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedContact(null)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            </DialogHeader>
            <ContactForm 
              contact={selectedContact}
              onSave={handleContactSaved}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTableOptimized
        columns={columns}
        data={filteredContacts}
        isLoading={isLoading}
        searchable={false}
        emptyMessage="No contacts found. Start by adding your first contact."
      />

      {/* Contact Profile Modal */}
      {profileContact && (
        <ContactProfile
          contact={profileContact}
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            setProfileContact(null);
          }}
          onEdit={() => {
            setSelectedContact(profileContact);
            setIsProfileOpen(false);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
};