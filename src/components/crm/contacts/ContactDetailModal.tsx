
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building, Edit } from 'lucide-react';
import { ContactOverviewTab } from './ContactOverviewTab';
import { ContactActivitiesTab } from './ContactActivitiesTab';
import { ContactNotesTab } from './ContactNotesTab';
import { CreateContactModal } from './CreateContactModal';
import type { Contact } from '@/types/crm';

interface ContactDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
}

export function ContactDetailModal({ open, onOpenChange, contact }: ContactDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  if (!contact) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg font-medium text-blue-600">
                    {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                  </span>
                </div>
                
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {contact.first_name} {contact.last_name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(contact.contact_status)}>
                      {contact.contact_status}
                    </Badge>
                    {contact.title && (
                      <span className="text-sm text-gray-500">{contact.title}</span>
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

            {/* Quick Contact Info */}
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{contact.email}</span>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.department && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>{contact.department}</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <ContactOverviewTab contact={contact} />
              </TabsContent>
              
              <TabsContent value="activities" className="mt-6">
                <ContactActivitiesTab contactId={contact.id} />
              </TabsContent>
              
              <TabsContent value="notes" className="mt-6">
                <ContactNotesTab contactId={contact.id} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <CreateContactModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        contact={contact}
        onSuccess={() => {
          setShowEditModal(false);
        }}
      />
    </>
  );
}
