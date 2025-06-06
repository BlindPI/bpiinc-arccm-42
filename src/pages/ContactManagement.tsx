import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactsTable } from '@/components/crm/contacts/ContactsTable';

export default function ContactManagement() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Management</h1>
          <p className="text-muted-foreground">
            Manage customer contacts with comprehensive profiles, communication preferences, and interaction history tracking
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>
            Complete contact management with account associations, communication logs, and relationship tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactsTable />
        </CardContent>
      </Card>
    </div>
  );
}