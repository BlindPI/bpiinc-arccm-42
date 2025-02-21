
import { Profile } from "@/types/user-management";
import { KeyRound } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface UserCredentialsHoverCardProps {
  profile: Profile;
}

export function UserCredentialsHoverCard({ profile }: UserCredentialsHoverCardProps) {
  if (!profile.is_test_data || !profile.credentials) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger>
        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
          <KeyRound className="h-4 w-4" />
          <span>View Credentials</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">Test User Credentials</h4>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Email:</span>{" "}
              {profile.credentials.email}
            </p>
            <p className="text-sm">
              <span className="font-medium">Password:</span>{" "}
              {profile.credentials.password}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
