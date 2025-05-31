
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Profile } from '@/types/profiles';

interface ProfileDetailsSectionProps {
  profile: Profile | null;
  isEditing: boolean;
  isSaving: boolean;
  formData: any;
  profileCompleteness: number;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileDetailsSection: React.FC<ProfileDetailsSectionProps> = ({
  profile,
  isEditing,
  isSaving,
  formData,
  profileCompleteness,
  onEdit,
  onCancel,
  onSave,
  onChange
}) => {
  const profileFields = [
    {
      id: 'display_name',
      label: 'Full Name',
      icon: User,
      value: isEditing ? formData.display_name : profile?.display_name || '',
      placeholder: 'Enter your full name',
      required: true
    },
    {
      id: 'email',
      label: 'Email Address',
      icon: Mail,
      value: profile?.email || '',
      placeholder: 'Email address',
      disabled: true
    },
    {
      id: 'phone',
      label: 'Phone Number',
      icon: Phone,
      value: isEditing ? formData.phone : profile?.phone || '',
      placeholder: 'Enter your phone number'
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: Building,
      value: isEditing ? formData.organization : profile?.organization || '',
      placeholder: 'Enter your organization'
    },
    {
      id: 'job_title',
      label: 'Job Title',
      icon: Briefcase,
      value: isEditing ? formData.job_title : profile?.job_title || '',
      placeholder: 'Enter your job title'
    }
  ];

  const completedFields = profileFields.filter(field => 
    field.value && String(field.value).trim() !== ''
  ).length;

  return (
    <div className="space-y-6">
      {/* Profile Completeness Alert */}
      {profileCompleteness < 100 && !isEditing && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Your profile is {profileCompleteness}% complete. Fill in all fields to unlock additional features and improve your experience.
          </AlertDescription>
        </Alert>
      )}

      {/* Personal Information Card */}
      <Card className="border-2 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Personal Information</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your personal details and contact information
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {completedFields}/{profileFields.length} Complete
              </Badge>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={onSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profileFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="flex items-center gap-2 text-sm font-medium">
                  <field.icon className="h-4 w-4 text-gray-500" />
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id={field.id}
                    name={field.id}
                    value={field.value}
                    placeholder={field.placeholder}
                    disabled={field.disabled || (!isEditing && field.id !== 'email')}
                    readOnly={field.disabled || (!isEditing && field.id !== 'email')}
                    onChange={onChange}
                    className={`${field.disabled ? 'bg-gray-50' : ''} ${
                      field.value && String(field.value).trim() !== '' ? 'border-green-200' : ''
                    }`}
                  />
                  {field.value && String(field.value).trim() !== '' && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                {field.disabled && field.id === 'email' && (
                  <p className="text-xs text-gray-500">
                    Email address cannot be changed for security reasons
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Information Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Role & Permissions</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Your current role and system permissions
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-700">Current Role</Label>
              <div className="mt-1">
                <Badge variant="default" className="text-sm">
                  {profile?.role || 'No role assigned'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Role assigned by</p>
              <p className="text-sm font-medium">System Administrator</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
