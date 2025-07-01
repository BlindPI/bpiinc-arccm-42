import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  Mail,
  Phone,
  Info,
  Award,
  Calendar,
  Shield,
  Users,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExtendedProfile } from "@/types/supabase-schema";
import {
  getSafeUserPhone,
  getSafeUserEmail,
  getSafeUserDisplayName,
  hasValidPhone,
  hasValidEmail
} from '@/utils/fixNullProfileAccessPatterns';

const roleNames: Record<string, string> = {
  'IT': 'Instructor Trainee',
  'IP': 'Instructor Provisional',
  'IC': 'Instructor Certified',
  'AP': 'Authorized Provider',
  'AD': 'Administrator',
  'SA': 'System Admin',
  'IN': 'Instructor New'
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ExtendedProfile | null;
  isAdmin?: boolean;
};

export const UserDetailDialog: React.FC<Props> = ({ open, onOpenChange, user, isAdmin }) => {
  const [tab, setTab] = useState('profile');
  if (!user) return null;

  const getInitials = (name?: string, email?: string) => {
    const safeName = getSafeUserDisplayName(user);
    const safeEmail = getSafeUserEmail(user);
    
    if (safeName && safeName !== 'Unknown User') {
      const parts = safeName.trim().split(" ");
      if (parts.length === 1) return parts[0][0] || "";
      return parts[0][0] + (parts[1]?.[0] || "");
    }
    if (safeEmail) return safeEmail[0]?.toUpperCase() || "U";
    return "U";
  };

  const userStatus = user.status || 'ACTIVE';

  const getRoleBadge = (role: string) => {
    if (role === 'SA') return <Badge variant="destructive" className="capitalize">{roleNames[role] || role}</Badge>;
    if (role === 'AD') return <Badge variant="secondary" className="capitalize">{roleNames[role] || role}</Badge>;
    return <Badge variant="outline" className="capitalize">{roleNames[role] || role}</Badge>;
  };
  const getStatusBadge = (status: string) => (
    <Badge 
      variant={status === 'ACTIVE' ? 'success' : status === 'PENDING' ? 'warning' : 'outline'} 
      className="capitalize"
    >
      {status}
    </Badge>
  );
  const getComplianceBadge = () => {
    if (user.compliance_status === true) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 gap-1" title="Compliant">
          <ShieldCheck className="w-4 h-4 text-green-700 mr-1" />
          Compliant
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 gap-1" title="Non-compliant">
        <AlertCircle className="w-4 h-4 text-yellow-600 mr-1" />
        Non-Compliant
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full bg-white dark:bg-background p-0 overflow-hidden animate-fade-in">
        <div className="flex flex-col md:flex-row h-full min-h-[420px]">
          <div className="w-full md:w-1/3 bg-gradient-to-b from-blue-500/90 to-purple-500/60 px-8 py-10 flex flex-col items-center gap-4 md:gap-8 justify-center border-r md:border-r border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-3xl uppercase ring-4 ring-primary/30 shadow-md mb-2">
                {getInitials()}
              </span>
              <div className="text-xl font-semibold text-white drop-shadow">{getSafeUserDisplayName(user)}</div>
              <div className="flex gap-2 mt-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(userStatus)}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2 w-full text-base text-blue-50/90">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-100" />
                <span className="truncate">
                  {hasValidEmail(user) ? getSafeUserEmail(user) : <span className="text-slate-100/50 italic">No email</span>}
                </span>
              </div>
              {hasValidPhone(user) && (
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-200" />
                  <span>{getSafeUserPhone(user)}</span>
                </div>
              )}
              {user.bio && (
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-300" />
                  <span>{user.bio}</span>
                </div>
              )}
            </div>
            <div className="mt-8 flex flex-col items-center">
              <span className="text-xs text-slate-100/80 mb-1">COMPLIANCE STATUS</span>
              {getComplianceBadge()}
            </div>
          </div>
          <div className="flex-1 w-full px-1 md:px-6 py-6 flex flex-col">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-50">
                  <UserIcon className="w-6 h-6 text-purple-600" />
                  <span className="text-lg font-bold leading-tight">
                    User Details
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            <Tabs value={tab} onValueChange={setTab} className="w-full mt-2 flex-1 flex flex-col">
              <TabsList className="w-max mx-auto md:mx-0 mb-3 border rounded-lg shadow bg-slate-100/80 dark:bg-slate-900/40 flex gap-3">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <Info className="w-4 h-4 mr-1" /> Profile
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 mr-1" /> Activity
                </TabsTrigger>
                <TabsTrigger value="supervision" className="flex items-center gap-2">
                  <Users className="w-4 h-4 mr-1" /> Supervision
                </TabsTrigger>
                <TabsTrigger value="certifications" className="flex items-center gap-2">
                  <Award className="w-4 h-4 mr-1" /> Certifications
                </TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="pt-2">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 mb-2">
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
                  <div className="col-span-2 mt-2 flex items-center gap-2">
                    <dt className="text-xs font-medium text-muted-foreground">Compliance Status</dt>
                    <dd className="">
                      {getComplianceBadge()}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 text-xs text-muted-foreground px-1">
                  Last updated: {user.updated_at ? new Date(user.updated_at).toLocaleString() : "N/A"}
                </div>
                {isAdmin && (
                  <div className="mt-7 px-1">
                    <dt className="text-xs font-medium text-muted-foreground mb-2">Admin Actions</dt>
                    <div className="text-xs text-slate-500">
                      Advanced actions will appear here in future releases.
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="activity" className="pt-2">
                <div className="text-[15px] text-muted-foreground">
                  <Calendar className="inline-block w-5 h-5 mr-1 text-blue-400" />
                  <span className="font-medium text-slate-900 dark:text-slate-200">User Activity Timeline</span>
                  <div className="mt-2 text-xs text-muted-foreground/80">
                    <div className="flex flex-col gap-2">
                      <div className="h-4 bg-gradient-to-r from-blue-200/60 via-purple-200/60 to-green-200/40 rounded w-2/3 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-purple-200/40 via-pink-200/70 to-blue-200/60 rounded w-1/2 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-blue-100/50 via-purple-100/50 to-pink-100/50 rounded w-1/3 animate-pulse"></div>
                      <span className="mt-2 text-xs text-slate-400">More detailed user activity integration coming soon.</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="supervision" className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-slate-900 dark:text-slate-200">Supervision Relationships</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  <div>No supervision relationships found for this user.<br />
                  (Integrated supervision management coming soon.)</div>
                </div>
              </TabsContent>
              <TabsContent value="certifications" className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-slate-900 dark:text-slate-200">Certifications</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  <div>
                    No certifications or awards recorded for this user.<br />
                    (Coming soon: certification records and export.)
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
