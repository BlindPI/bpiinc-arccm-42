
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
  User, 
  Mail, 
  Phone, 
  Building2,
  Eye
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CRMService } from '@/services/crm/enhancedCRMService';
import type { Contact } from '@/types/crm';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ContactForm } from './ContactForm';

const contactStatusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  bounced: 'bg-red-100 text-red-800'
};

interface ContactsTableProps {
  className?: string;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({ className }) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filters, setFilters] = useState({
    contact_status: 'all',
    account_id: 'all',
    lead_source: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => CRMService.getContacts({
      ...(filters.contact_status !== 'all' && { contact_status: filters.contact_status }),
      ...(filters.account_id !== 'all' && { account_id: filters.account_id })
    })
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
      (contact.department && contact.department.toLowerCase().includes(query))
    );
  }) || [];

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: 'name',
      header: 'Contact',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm">
                {contact.first_name} {contact.last_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {contact.title || 'No title'} {contact.department && `• ${contact.department}`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{contact.email}</span>
            {contact.do_not_email && (
              <Badge variant="outline" className="text-xs">
                No Email
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="space-y-1">
            {contact.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{contact.phone}</span>
              </div>
            )}
            {contact.mobile_phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{contact.mobile_phone}</span>
              </div>
            )}
            {contact.do_not_call && (
              <Badge variant="outline" className="text-xs">
                No Call
              </Badge>
            )}
          </div>
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
      accessorKey: 'lead_source',
      header: 'Source',
      cell: ({ row }) => {
        const contact = row.original;
        if (!contact.lead_source) return <span className="text-xs text-muted-foreground">Unknown</span>;
        
        return (
          <Badge variant="outline">
            {contact.lead_source.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'account',
      header: 'Account',
      cell: ({ row }) => {
        const contact = row.original;
        return contact.account_id ? (
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Account ID: {contact.account_id}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No account</span>
        );
      },
    },
    {
      accessorKey: 'last_activity_date',
      header: 'Last Activity',
      cell: ({ row }) => {
        const contact = row.original;
        return contact.last_activity_date ? (
          <span className="text-xs text-muted-foreground">
            {formatDate(contact.last_activity_date)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No activity</span>
        );
      },
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
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts?.filter(c => c.contact_status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Permitted</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts?.filter(c => !c.do_not_email).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Call Permitted</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts?.filter(c => !c.do_not_call).length || 0}
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
        
        {leadSources.length > 0 && (
          <Select value={filters.lead_source} onValueChange={(value) => setFilters({...filters, lead_source: value})}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {leadSources.map(source => (
                <SelectItem key={source} value={source!}>
                  {source!.replace('_', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedContact(null)}>
              <User className="mr-2 h-4 w-4" />
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
    </div>
  );
};
