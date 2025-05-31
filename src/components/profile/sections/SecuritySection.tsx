
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Key, 
  Clock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Lock,
  Smartphone
} from 'lucide-react';
import { AuthUserWithProfile } from '@/types/auth';

interface SecuritySectionProps {
  user: AuthUserWithProfile | null;
  securityScore: number;
  isChangingPassword: boolean;
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  showPasswords: {
    current: boolean;
    new: boolean;
    confirm: boolean;
  };
  onPasswordChange: () => void;
  onPasswordInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePasswordVisibility: (field: 'current' | 'new' | 'confirm') => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  user,
  securityScore,
  isChangingPassword,
  passwordData,
  showPasswords,
  onPasswordChange,
  onPasswordInputChange,
  onTogglePasswordVisibility
}) => {
  const securityItems = [
    {
      title: 'Password Strength',
      status: securityScore >= 80 ? 'Strong' : securityScore >= 60 ? 'Medium' : 'Weak',
      score: securityScore,
      icon: Key,
      color: securityScore >= 80 ? 'green' : securityScore >= 60 ? 'amber' : 'red'
    },
    {
      title: 'Two-Factor Authentication',
      status: 'Not Enabled',
      score: 0,
      icon: Smartphone,
      color: 'red',
      action: 'Enable 2FA'
    },
    {
      title: 'Login Sessions',
      status: 'Active',
      score: 100,
      icon: Clock,
      color: 'green',
      action: 'Manage Sessions'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.green;
  };

  return (
    <div className="space-y-6">
      {/* Security Score Overview */}
      <Card className="border-2 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Security Overview</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Your account security status and recommendations
                </p>
              </div>
            </div>
            <Badge variant={securityScore >= 80 ? 'default' : 'destructive'} className="text-sm">
              {securityScore}% Secure
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {securityScore < 80 && (
            <Alert className="bg-amber-50 border-amber-200 mb-6">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Your security score is below recommended levels. Consider enabling two-factor authentication and updating your password.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {securityItems.map((item, index) => {
              const colors = getColorClasses(item.color);
              
              return (
                <div key={index} className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <item.icon className={`h-5 w-5 ${colors.text}`} />
                    <span className={`text-xs font-medium ${colors.text}`}>
                      {item.score}%
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                  <p className={`text-sm ${colors.text} mb-2`}>{item.status}</p>
                  {item.action && (
                    <Button variant="outline" size="sm" className="w-full">
                      {item.action}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Account Information</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Account creation and login history
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Account Created</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Last Sign In</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Lock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Password Management</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Update your account password for enhanced security
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={onPasswordInputChange}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => onTogglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={onPasswordInputChange}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => onTogglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={onPasswordInputChange}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => onTogglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={onPasswordChange}
              disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full md:w-auto"
            >
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
