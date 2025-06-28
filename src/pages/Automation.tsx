
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export default function Automation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automation</h1>
        <p className="text-muted-foreground">
          Manage automated workflows and processes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automation Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Automation functionality will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
