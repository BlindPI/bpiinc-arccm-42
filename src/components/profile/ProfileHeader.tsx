
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileHeaderProps {
  profile: any;
  profileCompleteness: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProfileHeader({ profile, profileCompleteness, activeTab, onTabChange }: ProfileHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-blue-600">
              {profile?.display_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile?.display_name || 'User'}</h2>
            <p className="text-muted-foreground">{profile?.email}</p>
            <p className="text-sm text-muted-foreground">{profile?.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
