
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExtendedProfile } from '@/types/supabase-schema';
import { formatDistanceToNow } from 'date-fns';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Activity,
  Building,
  Award
} from 'lucide-react';

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ExtendedProfile | null;
  isAdmin: boolean;
}

export function UserDetailDialog({ open, onOpenChange, user, isAdmin }: UserDetailDialogProps) {
  if (!user) return null;

  const roleNames: Record<string, string> = {
    'IT': 'Instructor Trainee',
    'IP': 'Instructor Provisional', 
    'IC': 'Instructor Certified',
    'AP': 'Authorized Provider',
    'AD': 'Administrator',
    'SA': 'System Admin'
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold text-lg uppercase">
              {user.display_name?.[0] || user.email?.[0] || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user.display_name || 'Unnamed User'}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.department || 'No department'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.job_title || 'No job title'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Role & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={user.role === 'SA' ? 'destructive' : 'default'}>
                  {roleNames[user.role] || user.role}
                </Badge>
                <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {user.status || 'Unknown'}
                </Badge>
                {user.compliance_status !== undefined && (
                  <Badge variant={user.compliance_status ? 'default' : 'destructive'}>
                    {user.compliance_status ? 'Compliant' : 'Non-Compliant'}
                  </Badge>
                )}
              </div>
              
              {user.compliance_score !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Compliance Score</span>
                    <span className="font-medium">{user.compliance_score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${user.compliance_score}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Activity Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">{formatDate(user.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">{getRelativeTime(user.updated_at)}</span>
                </div>
                {user.last_login && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Login</span>
                    <span className="text-sm font-medium">{getRelativeTime(user.last_login)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {(user.team_count !== undefined || user.certifications_count !== undefined || user.pending_actions !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {user.team_count !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{user.team_count}</div>
                      <div className="text-xs text-muted-foreground">Teams</div>
                    </div>
                  )}
                  {user.certifications_count !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-green-600">{user.certifications_count}</div>
                      <div className="text-xs text-muted-foreground">Certifications</div>
                    </div>
                  )}
                  {user.pending_actions !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{user.pending_actions}</div>
                      <div className="text-xs text-muted-foreground">Pending Actions</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
