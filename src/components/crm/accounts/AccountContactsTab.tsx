
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, User, Mail, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { CreateContactModal } from '../contacts/CreateContactModal';

interface AccountContactsTabProps {
  accountId: string;
}

export function AccountContactsTab({ accountId }: AccountContactsTabProps) {
  const [showContactForm, setShowContactForm] = useState(false);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['account-contacts', accountId],
    queryFn: () => CRMService.getContacts()
  });

  // Filter contacts for this account
  const accountContacts = contacts.filter(contact => contact.account_id === accountId);

  if (isLoading) {
    return <div>Loading contacts...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Contacts ({accountContacts.length})</h3>
          <Button onClick={() => setShowContactForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <div className="space-y-3">
          {accountContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No contacts yet</p>
              <p className="text-sm">Add contacts to track relationships with this account</p>
            </div>
          ) : (
            accountContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{contact.first_name} {contact.last_name}</h4>
                    <p className="text-sm text-gray-500">{contact.title || 'Contact'}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
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
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <CreateContactModal
        open={showContactForm}
        onOpenChange={setShowContactForm}
        onSuccess={() => setShowContactForm(false)}
      />
    </>
  );
}
