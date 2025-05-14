
import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";

export interface UserCredentialsHoverCardProps {
  userId: string;
  userName?: string;
}

export function UserCredentialsHoverCard({ userId, userName }: UserCredentialsHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="icon">
          <Key className="h-4 w-4" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex flex-col space-y-2">
          <h4 className="font-medium">User Credentials</h4>
          <p className="text-sm text-muted-foreground">
            ID: {userId}
          </p>
          {userName && (
            <p className="text-sm text-muted-foreground">
              Name: {userName}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            For security reasons, credentials are managed through the Supabase admin panel.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
