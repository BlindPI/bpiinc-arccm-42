
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

export function OpportunitiesListView() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Opportunities Module</p>
        <p className="text-sm text-gray-400">Professional opportunities pipeline coming soon</p>
      </CardContent>
    </Card>
  );
}
