
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  Download
} from 'lucide-react';
import { ContactFormDialog } from '@/components/crm/forms/ContactFormDialog';
import { toast } from 'sonner';
import type { Contact } from '@/types/crm';

interface ContactsTableProps {
  contacts: Contact[];
  isLoading: boolean;
  onCreateContact: (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateContact: (id: string, contactData: Partial<Contact>) => void;
  onDeleteContact: (id: string) => void;
}

export function ContactsTable({ 
  contacts, 
  isLoading, 
  onCreateContact, 
  onUpdateContact, 
  onDeleteContact 
}: ContactsTableProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateContact = () => {
    setSelectedContact(undefined);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    if (confirm(`Are you sure you want to delete the contact ${contact.first_name} ${contact.last_name}?`)) {
      onDeleteContact(contact.id);
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Title', 'Status', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...contacts.map(contact => [
        `"${contact.first_name} ${contact.last_name}"`,
        contact.email,
        contact.phone || '',
        `"${contact.title || ''}"`,
        contact.contact_status,
        new Date(contact.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Contacts exported successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Contacts ({contacts.length})</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleCreateContact}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No contacts found. Create your first contact to get started.</p>
            <Button onClick={handleCreateContact} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Contact
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-medium">{contact.first_name} {contact.last_name}</h3>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                    {contact.title && (
                      <p className="text-sm text-gray-400">{contact.title}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(contact.contact_status)}>
                    {contact.contact_status}
                  </Badge>
                  <Badge variant="outline">
                    {contact.preferred_contact_method}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewContact(contact)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteContact(contact)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={selectedContact}
        mode={dialogMode}
      />
    </>
  );
}
