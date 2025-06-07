
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';

interface ContactBulkOperationsProps {
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
}

export function ContactBulkOperations({ selectedItems, onSelectionChange }: ContactBulkOperationsProps) {
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => CRMService.getContacts()
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(contacts.map(contact => contact.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (contactId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, contactId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== contactId));
    }
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
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading contacts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contact Bulk Operations</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedItems.length === contacts.length && contacts.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Select All</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedItems.includes(contact.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedItems.includes(contact.id)}
                  onCheckedChange={(checked) => handleSelectItem(contact.id, checked as boolean)}
                />
                <div>
                  <div className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {contact.email} • {contact.company}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(contact.contact_status)}>
                  {contact.contact_status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {contact.phone}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {contacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No contacts found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
