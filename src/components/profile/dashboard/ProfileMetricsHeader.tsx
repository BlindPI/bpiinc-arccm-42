
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Shield, 
  Activity, 
  Settings,
  Download,
  Camera,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { Profile } from '@/types/profiles';

interface ProfileMetricsHeaderProps {
  profile: Profile | null;
  profileCompleteness: number;
  securityScore: number;
  recentActivity: number;
  onPhotoUpload?: () => void;
}

export const ProfileMetricsHeader: React.FC<ProfileMetricsHeaderProps> = ({
  profile,
  profileCompleteness,
  securityScore,
  recentActivity,
  onPhotoUpload
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const metrics = [
    {
      title: 'Profile Completeness',
      value: `${profileCompleteness}%`,
      icon: User,
      color: getScoreColor(profileCompleteness),
      description: 'Complete your profile',
      trend: profileCompleteness >= 80 ? 'Excellent' : 'Needs attention'
    },
    {
      title: 'Security Score',
      value: `${securityScore}%`,
      icon: Shield,
      color: getScoreColor(securityScore),
      description: 'Account security level',
      trend: securityScore >= 80 ? 'Strong' : 'Improve security'
    },
    {
      title: 'Recent Activity',
      value: recentActivity,
      icon: Activity,
      color: 'text-blue-600',
      description: 'Actions this week',
      trend: 'Active user'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Avatar Section */}
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'User'} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xl">
                {profile?.display_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 shadow-md"
              onClick={onPhotoUpload}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          
          {/* User Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {profile?.display_name || 'User Profile'}
            </h1>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {profile?.role || 'No Role'}
              </Badge>
              {profileCompleteness >= 80 && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Profile Complete
                </Badge>
              )}
              {securityScore < 80 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Security Alert
                </Badge>
              )}
            </div>
            <p className="text-gray-600">
              {profile?.email}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-gray-50">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {metric.description}
                  </p>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">
                      {metric.trend}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
