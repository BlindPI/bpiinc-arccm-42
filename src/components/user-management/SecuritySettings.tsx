
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/profiles";
import type { AuthUserWithProfile } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";

interface SecuritySettingsProps {
  user: AuthUserWithProfile | null;
  profile: Profile | null;
}

export function SecuritySettings({ user, profile }: SecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updatePassword } = useAuth();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!updatePassword) {
      toast.error("Password update functionality not available");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const result = await updatePassword(newPassword);
      
      if (!result.success) {
        throw new Error(result.error || "Password update failed");
      }
      
      toast.success("Password updated successfully");
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Security Settings
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account security and password
        </p>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          We recommend using a strong, unique password and enabling two-factor authentication if available.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium mb-4">Change Password</h4>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter your current password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter your new password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your new password"
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
        
        <div>
          <h4 className="text-md font-medium mb-2">Account Information</h4>
          <dl className="divide-y divide-gray-100">
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-300">Email</dt>
              <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">{user?.email || "N/A"}</dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-300">Last Sign In</dt>
              <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {user?.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleString() 
                  : "N/A"
                }
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-300">Account Created</dt>
              <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {user?.created_at 
                  ? new Date(user.created_at).toLocaleDateString() 
                  : "N/A"
                }
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
