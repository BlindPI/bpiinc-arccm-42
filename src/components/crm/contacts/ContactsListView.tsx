
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
  Phone,
  Mail,
  Building,
  Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { ContactDetailModal } from './ContactDetailModal';
import { CreateContactModal } from './CreateContactModal';
import type { Contact } from '@/types/crm';

export function ContactsListView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => CRMService.getContacts()
  });

  const filteredContacts = contacts.filter(contact =>
    contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
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
                placeholder="Search contacts..."
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
            New Contact
          </Button>
        </div>

        {/* Contacts List */}
        <div className="space-y-2">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No contacts found</p>
              <p className="text-sm">Create your first contact to get started</p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Contact
              </Button>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-white"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      <Badge className={getStatusColor(contact.contact_status)}>
                        {contact.contact_status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.title && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {contact.title}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>Source: {contact.lead_source || 'Direct'}</span>
                      <span>Created: {new Date(contact.created_at).toLocaleDateString()}</span>
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
                    <DropdownMenuItem onClick={() => handleViewContact(contact)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Contact
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
      <CreateContactModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        contact={selectedContact}
        onSuccess={() => {
          setShowCreateModal(false);
          setSelectedContact(null);
        }}
      />

      <ContactDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        contact={selectedContact}
      />
    </>
  );
}
