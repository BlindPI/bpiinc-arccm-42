
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { UserProfile } from "@/types/auth";
import { ProfileMetricsHeader } from "@/components/profile/dashboard/ProfileMetricsHeader";
import { ProfileNavigationCards } from "@/components/profile/navigation/ProfileNavigationCards";
import { ProfileDetailsSection } from "@/components/profile/sections/ProfileDetailsSection";
import { SecuritySection } from "@/components/profile/sections/SecuritySection";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading, mutate } = useProfile();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  
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

  // Calculate profile completeness and security score
  const calculateProfileCompleteness = (profileData: Partial<UserProfile> | null) => {
    if (!profileData) return 0;
    
    const fields = [
      'display_name',
      'email',
      'phone',
      'organization',
      'job_title'
    ];
    
    const filledFields = fields.filter(field =>
      profileData[field as keyof UserProfile] &&
      String(profileData[field as keyof UserProfile]).trim() !== ''
    );
    
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const calculateSecurityScore = () => {
    let score = 50; // Base score
    if (user?.email) score += 20;
    if (passwordData.newPassword.length >= 8) score += 20;
    // Add more security checks as needed
    return Math.min(score, 100);
  };

  // Initialize form data when profile data is loaded
  useEffect(() => {
    if (profile && !isLoading) {
      setFormData({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        organization: profile.organization || '',
        job_title: profile.job_title || ''
      });
      setProfileCompleteness(calculateProfileCompleteness(profile));
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
    if (!user) return;
    
    setIsSaving(true);
    try {
      await user.updateProfile?.(formData);
      mutate();
      
      setProfileCompleteness(calculateProfileCompleteness({
        ...profile,
        ...formData
      }));
      
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
      const result = await user?.updatePassword?.(passwordData.newPassword);
      if (result?.success) {
        toast.success("Password updated successfully");
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(result?.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
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
            securityScore={calculateSecurityScore()}
            isChangingPassword={isChangingPassword}
            passwordData={passwordData}
            showPasswords={showPasswords}
            onPasswordChange={handlePasswordChange}
            onPasswordInputChange={handlePasswordInputChange}
            onTogglePasswordVisibility={togglePasswordVisibility}
          />
        );
      case 'preferences':
        return (
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Preferences Coming Soon</h3>
                <p className="text-gray-500">Notification and display preferences will be available in a future update.</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'activity':
        return (
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Activity History Coming Soon</h3>
                <p className="text-gray-500">Your account activity timeline will be available in a future update.</p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Metrics */}
        <ProfileMetricsHeader
          profile={profile}
          profileCompleteness={profileCompleteness}
          securityScore={calculateSecurityScore()}
          recentActivity={7} // Mock data
        />

        {/* Navigation Cards */}
        <ProfileNavigationCards
          activeTab={activeTab}
          onTabChange={setActiveTab}
          profileCompleteness={profileCompleteness}
          securityScore={calculateSecurityScore()}
          activityCount={12} // Mock data
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
