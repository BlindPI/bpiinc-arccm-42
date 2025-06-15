
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Building } from 'lucide-react';

export function ContactsListView() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Contacts Module</p>
        <p className="text-sm text-gray-400">Professional contacts list view coming soon</p>
      </CardContent>
    </Card>
  );
}
