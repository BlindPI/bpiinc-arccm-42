
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/profiles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUploadModal } from "./ImageUploadModal";

interface ProfileHeaderProps {
  profile: Profile | null;
  onUpdateSuccess: () => Promise<void>;
}

export function ProfileHeader({ profile, onUpdateSuccess }: ProfileHeaderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Use useCallback to prevent unnecessary re-renders
  const handleAvatarUpdate = useCallback(async (file: File) => {
    if (!user?.id || isUploading) return;
    
    try {
      setIsUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      toast.success("Profile image updated successfully");
      
      // Use a small timeout to prevent immediate cascade of state updates
      setTimeout(() => {
        onUpdateSuccess().catch(console.error);
        setShowUploadModal(false);
        setIsUploading(false);
      }, 100);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to update profile image");
      setIsUploading(false);
      setShowUploadModal(false);
    }
  }, [user?.id, isUploading, onUpdateSuccess]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="relative group">
        <Avatar className="h-20 w-20 border-2 border-primary/20">
          <AvatarImage src={profile?.avatar_url || ""} alt={profile?.display_name || "User"} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
            {getInitials(profile?.display_name)}
          </AvatarFallback>
        </Avatar>
        <Button 
          size="icon" 
          variant="outline" 
          className="absolute bottom-0 right-0 h-7 w-7 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setShowUploadModal(true)}
          type="button"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex-1">
        <h1 className="text-2xl font-bold">
          {profile?.display_name || "Welcome"}
        </h1>
        <p className="text-muted-foreground">
          {profile?.email || user?.email || "Complete your profile to get started"}
        </p>
      </div>
      
      <ImageUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onImageUpload={handleAvatarUpdate}
        isUploading={isUploading}
      />
    </div>
  );
}
