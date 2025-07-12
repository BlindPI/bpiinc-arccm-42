import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Activity,
  Clock,
  UserCheck,
  Settings,
  Loader2
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const roleNames: Record<string, string> = {
  'IT': 'Instructor Trainee',
  'IP': 'Instructor Provisional',
  'IC': 'Instructor Certified',
  'AP': 'Authorized Provider',
  'AD': 'Administrator',
  'SA': 'System Admin',
  'IN': 'Instructor New'
};

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  metadata?: any;
  created_at: string;
}

interface SupervisionRelationship {
  id: string;
  supervisor_id: string;
  supervisee_id: string;
  status: string;
  created_at: string;
  supervisor_name?: string;
  supervisee_name?: string;
}

interface UserCertification {
  id: string;
  user_id: string;
  certification_name: string;
  certification_type: string;
  issued_date: string;
  expiry_date?: string;
  status: string;
  issuing_authority?: string;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ExtendedProfile | null;
  isAdmin?: boolean;
};

export const UserDetailDialog: React.FC<Props> = ({ open, onOpenChange, user, isAdmin }) => {
  const [tab, setTab] = useState('profile');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [supervisionRelationships, setSupervisionRelationships] = useState<SupervisionRelationship[]>([]);
  const [certifications, setCertifications] = useState<UserCertification[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingSupervision, setLoadingSupervision] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);

  if (!user) return null;

  // Load activity logs
  const loadActivityLogs = async () => {
    setLoadingActivity(true);
    try {
  const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityLogs((data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        activity_type: log.activity_type,
        description: log.description,
        metadata: log.metadata,
        created_at: log.created_at
      })));
    } catch (error: any) {
      console.error('Error loading activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoadingActivity(false);
    }
  };

  // Load supervision relationships
  const loadSupervisionRelationships = async () => {
    setLoadingSupervision(true);
    try {
      // Get relationships where user is supervisor
      const { data: supervisorData, error: supervisorError } = await supabase
        .from('supervision_relationships')
        .select(`
          *,
          supervisee:profiles!supervisee_id(display_name, email)
        `)
        .eq('supervisor_id', user.id);

      // Get relationships where user is supervisee
      const { data: superviseeData, error: superviseeError } = await supabase
        .from('supervision_relationships')
        .select(`
          *,
          supervisor:profiles!supervisor_id(display_name, email)
        `)
        .eq('supervisee_id', user.id);

      if (supervisorError) throw supervisorError;
      if (superviseeError) throw superviseeError;

      const relationships = [
        ...(supervisorData || []).map(rel => ({
          ...rel,
          supervisee_name: rel.supervisee?.display_name || 'Unknown'
        })),
        ...(superviseeData || []).map(rel => ({
          ...rel,
          supervisor_name: rel.supervisor?.display_name || 'Unknown'
        }))
      ];

      setSupervisionRelationships(relationships);
    } catch (error: any) {
      console.error('Error loading supervision relationships:', error);
      toast.error('Failed to load supervision relationships');
    } finally {
      setLoadingSupervision(false);
    }
  };

  // Load certifications
  const loadCertifications = async () => {
    setLoadingCertifications(true);
    try {
      const { data, error } = await supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_date', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error: any) {
      console.error('Error loading certifications:', error);
      toast.error('Failed to load certifications');
    } finally {
      setLoadingCertifications(false);
    }
  };

  // Load data when dialog opens or tab changes
  useEffect(() => {
    if (open && user) {
      if (tab === 'activity') {
        loadActivityLogs();
      } else if (tab === 'supervision') {
        loadSupervisionRelationships();
      } else if (tab === 'certifications') {
        loadCertifications();
      }
    }
  }, [open, user, tab]);

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
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-slate-900 dark:text-slate-200">User Activity Timeline</span>
                </div>
                
                {loadingActivity ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : activityLogs.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                        <div className="flex-shrink-0 mt-1">
                          {log.activity_type === 'login' && <UserCheck className="w-4 h-4 text-green-500" />}
                          {log.activity_type === 'logout' && <Clock className="w-4 h-4 text-gray-500" />}
                          {log.activity_type === 'profile_update' && <Settings className="w-4 h-4 text-blue-500" />}
                          {log.activity_type === 'role_change' && <Shield className="w-4 h-4 text-purple-500" />}
                          {!['login', 'logout', 'profile_update', 'role_change'].includes(log.activity_type) && <Activity className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {log.description}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                          {log.metadata && (
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Activity className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>No activity logs found for this user.</p>
                    <p className="text-xs mt-1">Activity tracking may not be enabled or this is a new user.</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="supervision" className="pt-2">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-slate-900 dark:text-slate-200">Supervision Relationships</span>
                </div>
                
                {loadingSupervision ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : supervisionRelationships.length > 0 ? (
                  <div className="space-y-4">
                    {supervisionRelationships
                      .filter(rel => rel.supervisor_id === user.id)
                      .length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          Supervising Others
                        </h4>
                        <div className="space-y-2">
                          {supervisionRelationships
                            .filter(rel => rel.supervisor_id === user.id)
                            .map((rel) => (
                              <div key={rel.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {rel.supervisee_name}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Since: {new Date(rel.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`text-xs ${
                                  rel.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' :
                                  rel.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                  'bg-gray-100 text-gray-800 border-gray-300'
                                }`}>
                                  {rel.status}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {supervisionRelationships
                      .filter(rel => rel.supervisee_id === user.id)
                      .length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-green-500" />
                          Supervised By
                        </h4>
                        <div className="space-y-2">
                          {supervisionRelationships
                            .filter(rel => rel.supervisee_id === user.id)
                            .map((rel) => (
                              <div key={rel.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {rel.supervisor_name}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Since: {new Date(rel.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`text-xs ${
                                  rel.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' :
                                  rel.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                  'bg-gray-100 text-gray-800 border-gray-300'
                                }`}>
                                  {rel.status}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>No supervision relationships found for this user.</p>
                    <p className="text-xs mt-1">This user is not currently supervising anyone or being supervised.</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="certifications" className="pt-2">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-slate-900 dark:text-slate-200">Certifications & Awards</span>
                </div>
                
                {loadingCertifications ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : certifications.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {cert.certification_name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {cert.certification_type}
                            </p>
                            {cert.issuing_authority && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                Issued by: {cert.issuing_authority}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>Issued: {new Date(cert.issued_date).toLocaleDateString()}</span>
                              {cert.expiry_date && (
                                <span className={new Date(cert.expiry_date) < new Date() ? 'text-red-600' : ''}>
                                  Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Badge variant="outline" className={`text-xs ${
                              cert.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' :
                              cert.status === 'expired' ? 'bg-red-100 text-red-800 border-red-300' :
                              cert.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            }`}>
                              {cert.status}
                            </Badge>
                            {cert.expiry_date && new Date(cert.expiry_date) < new Date() && (
                              <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-300">
                                Expired
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Award className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>No certifications found for this user.</p>
                    <p className="text-xs mt-1">Certifications will appear here once they are added to the system.</p>
                  </div>
                )}
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
