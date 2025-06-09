
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Profile } from '@/types/profiles';

interface ProfileHeaderProps {
  profile: Profile | null;
  profileCompleteness: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  profileCompleteness,
  activeTab,
  onTabChange
}) => {
  const tabs = [
    {
      id: 'details',
      title: 'Profile Details',
      description: 'Personal information and contact details',
      icon: User,
      badge: profileCompleteness < 100 ? 'Incomplete' : 'Complete',
      badgeVariant: profileCompleteness < 100 ? 'secondary' : 'default'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Password and account security',
      icon: Shield,
      badge: 'Secure',
      badgeVariant: 'default'
    }
  ];

  return (
    <div className="space-y-6">
      {/* User Info Section */}
      <Card className="border-2 hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xl">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {/* User Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile?.display_name || 'User Profile'}
                </h1>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {profile?.role || 'No Role'}
                  </Badge>
                  {profileCompleteness >= 100 && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Profile Complete
                    </Badge>
                  )}
                  {profileCompleteness < 100 && (
                    <Badge variant="secondary">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {profileCompleteness}% Complete
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tabs.map((tab) => (
          <Card 
            key={tab.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 ${
              activeTab === tab.id ? 'ring-2 ring-primary shadow-lg scale-105 border-primary' : 'border-gray-200'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-50'}`}>
                    <tab.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {tab.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {tab.description}
                    </p>
                  </div>
                </div>
                <Badge variant={tab.badgeVariant as any} className="text-xs">
                  {tab.badge}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};
