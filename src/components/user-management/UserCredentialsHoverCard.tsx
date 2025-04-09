
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Key, RefreshCw, UserCog, Copy } from "lucide-react";
import { toast } from "sonner";
import { Profile } from "@/types/user-management";

interface UserCredentialsHoverCardProps {
  profile: Profile;
}

export function UserCredentialsHoverCard({ profile }: UserCredentialsHoverCardProps) {
  const handleResetPassword = async () => {
    // Implement password reset logic
    toast.success(`Password reset email sent to ${profile.email || 'user'}`);
  };

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(profile.id);
    toast.success("User ID copied to clipboard");
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserCog className="h-4 w-4" />
          <span className="sr-only">User actions</span>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">User Information</h4>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <span className="text-muted-foreground">Name:</span>
              <span>{profile.display_name || 'No name set'}</span>
              
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="outline" className="justify-self-start">
                {profile.role}
              </Badge>
              
              <span className="text-muted-foreground">ID:</span>
              <div className="flex items-center gap-1">
                <span className="truncate">{profile.id}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4" 
                  onClick={handleCopyUserId}
                >
                  <Copy className="h-3 w-3" />
                  <span className="sr-only">Copy ID</span>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetPassword}
              className="text-xs"
            >
              <Key className="mr-1 h-3 w-3" />
              Reset Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Regenerate API Key
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
