
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileDetailsSectionProps {
  profile: any;
  isEditing: boolean;
  isSaving: boolean;
  formData: any;
  profileCompleteness: number;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileDetailsSection({ 
  profile, 
  isEditing, 
  isSaving, 
  formData, 
  profileCompleteness, 
  onEdit, 
  onCancel, 
  onSave, 
  onChange 
}: ProfileDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Display Name</label>
            <p className="text-sm text-muted-foreground">{profile?.display_name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground">{profile?.email || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <p className="text-sm text-muted-foreground">{profile?.role || 'Not set'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
