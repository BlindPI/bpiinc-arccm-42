
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building } from 'lucide-react';

export function AccountsListView() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Accounts Module</p>
        <p className="text-sm text-gray-400">Professional accounts list view coming soon</p>
      </CardContent>
    </Card>
  );
}
