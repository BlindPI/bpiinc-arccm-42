import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, User as UserIcon, Phone, Info } from "lucide-react";
import type { ExtendedProfile } from "@/types/supabase-schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ExtendedProfile | null;
  isAdmin?: boolean;
};

export const UserDetailDialog: React.FC<Props> = ({ open, onOpenChange, user, isAdmin }) => {
  if (!user) return null;

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length === 1) return parts[0][0] || "";
      return parts[0][0] + (parts[1]?.[0] || "");
    }
    if (email) return email[0]?.toUpperCase() || "U";
    return "U";
  };

  const roleNames: Record<string, string> = {
    'IT': 'Instructor Trainee',
    'IP': 'Instructor Provisional',
    'IC': 'Instructor Certified',
    'AP': 'Admin Provisional',
    'AD': 'Administrator',
    'SA': 'System Admin'
  };

  const userStatus: 'ACTIVE' | 'INACTIVE' = user.status || 'ACTIVE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full bg-white dark:bg-background animate-fade-in">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-2xl uppercase ring-2 ring-primary/40">
                {getInitials(user.display_name, user.email)}
              </span>
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">{user.display_name || "No Name"}</div>
                <div className="mt-1 flex gap-2 items-center">
                  <Badge variant={user.role === 'SA' ? 'destructive' : 'default'} className="capitalize">{roleNames[user.role] || user.role}</Badge>
                  <Badge variant={userStatus === 'ACTIVE' ? 'default' : 'outline'} className="capitalize">{userStatus}</Badge>
                </div>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            {user.email && (
              <div className="flex items-center gap-2 my-1 text-[15px] text-muted-foreground">
                <Mail className="w-4 h-4 text-blue-500" />{user.email}
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 my-1 text-[15px] text-muted-foreground">
                <Phone className="w-4 h-4 text-green-500" />{user.phone}
              </div>
            )}
            {user.bio && (
              <div className="flex items-center gap-2 my-1 text-[15px] text-muted-foreground">
                <Info className="w-4 h-4 text-amber-500" />{user.bio}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-3 px-2">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">User ID</dt>
              <dd className="text-sm text-foreground truncate">{user.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Role</dt>
              <dd className="text-sm text-foreground">{roleNames[user.role] || user.role}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Status</dt>
              <dd className="text-sm text-foreground">{userStatus}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Created At</dt>
              <dd className="text-sm text-foreground">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
              </dd>
            </div>
          </dl>
          
          {isAdmin && (
            <div className="mt-4 px-1">
              <dt className="text-xs font-medium text-muted-foreground mb-1">Admin Actions</dt>
              <p className="text-xs text-muted-foreground">Advanced actions will appear here in future releases.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
