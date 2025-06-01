
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileDetailsSection } from "@/components/profile/sections/ProfileDetailsSection";
import { SecuritySection } from "@/components/profile/sections/SecuritySection";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading, mutate } = useProfile();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Calculate profile completeness
  const calculateProfileCompleteness = (profileData: any) => {
    if (!profileData) return 0;
    
    const fields = ['display_name', 'email', 'phone', 'organization', 'job_title'];
    const filledFields = fields.filter(field =>
      profileData[field] && String(profileData[field]).trim() !== ''
    );
    
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const profileCompleteness = calculateProfileCompleteness(profile);

  // Initialize form data when profile data is loaded
  useEffect(() => {
    if (profile && !isLoading) {
      setFormData({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        organization: profile.organization || '',
        job_title: profile.job_title || ''
      });
    }
  }, [profile, isLoading]);

  const handleEdit = () => {
    setFormData({
      display_name: profile?.display_name || '',
      phone: profile?.phone || '',
      organization: profile?.organization || '',
      job_title: profile?.job_title || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;
      
      mutate();
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: passwordData.newPassword 
      });
      
      if (error) throw error;
      
      toast.success("Password updated successfully");
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <ProfileDetailsSection
            profile={profile}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            profileCompleteness={profileCompleteness}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            onChange={handleChange}
          />
        );
      case 'security':
        return (
          <SecuritySection
            user={user}
            isChangingPassword={isChangingPassword}
            passwordData={passwordData}
            showPasswords={showPasswords}
            onPasswordChange={handlePasswordChange}
            onPasswordInputChange={handlePasswordInputChange}
            onTogglePasswordVisibility={togglePasswordVisibility}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <ProfileHeader
          profile={profile}
          profileCompleteness={profileCompleteness}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Active Tab Content */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="min-h-[60vh]">
              {renderTabContent()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
