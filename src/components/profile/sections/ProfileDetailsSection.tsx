
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileDetailsSectionProps {
  user: any;
}

export function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Display Name</label>
            <p className="text-sm text-muted-foreground">{user?.display_name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground">{user?.email || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <p className="text-sm text-muted-foreground">{user?.role || 'Not set'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
