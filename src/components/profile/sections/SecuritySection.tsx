
import React from 'react';
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
  Lock,
  Info
} from 'lucide-react';
import { AuthUserWithProfile } from '@/types/auth';

interface SecuritySectionProps {
  user: AuthUserWithProfile | null;
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
  isChangingPassword,
  passwordData,
  showPasswords,
  onPasswordChange,
  onPasswordInputChange,
  onTogglePasswordVisibility
}) => {
  const getPasswordStrength = () => {
    const password = passwordData.newPassword;
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 25;
    
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return 'No password';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 50) return 'text-red-600';
    if (strength < 75) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="border-2 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Account Security</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Manage your account password and security settings
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Keep your account secure by using a strong password and updating it regularly.
            </AlertDescription>
          </Alert>
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
          <div className="space-y-6">
            {/* Password Strength Indicator */}
            {passwordData.newPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Password Strength</Label>
                  <span className={`text-sm font-medium ${getStrengthColor(passwordStrength)}`}>
                    {getStrengthLabel(passwordStrength)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength < 50 ? 'bg-red-500' : 
                      passwordStrength < 75 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Password Fields */}
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
                disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full md:w-auto"
              >
                <Key className="h-4 w-4 mr-2" />
                {isChangingPassword ? 'Updating Password...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
