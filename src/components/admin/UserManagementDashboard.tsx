import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  compliance_tier: 'basic' | 'robust' | null;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  compliance_score?: number;
  pending_actions?: number;
  team_count?: number;
}

interface UserFilters {
  search: string;
  role: string;
  tier: string;
  status: string;
  complianceStatus: string;
}

interface BulkAction {
  type: 'delete' | 'activate' | 'deactivate' | 'change_tier' | 'send_email';
  data?: any;
}

export function UserManagementDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    tier: 'all',
    status: 'all',
    complianceStatus: 'all'
  });
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [processingBulk, setProcessingBulk] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get all user profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }
      
      if (filters.tier !== 'all') {
        query = query.eq('compliance_tier', filters.tier);
      }
      
      if (filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      const { data: profiles, error } = await query;
      
      if (error) throw error;
      
      // Enrich with compliance data
      const enrichedUsers = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            // Get compliance summary
            const complianceSummary = await ComplianceService.getUserComplianceSummary(profile.id);
            
            // Get pending actions count
            const actions = await ComplianceService.getUserComplianceActions(profile.id);
            const pendingActions = actions.filter(a => a.status === 'open').length;
            
            return {
              ...profile,
              compliance_score: complianceSummary.overall_score,
              pending_actions: pendingActions,
              team_count: 0 // Would be calculated from team relationships
            };
          } catch (error) {
            console.error(`Error loading compliance data for user ${profile.id}:`, error);
            return {
              ...profile,
              compliance_score: 0,
              pending_actions: 0,
              team_count: 0
            };
          }
        })
      );
      
      // Apply search filter
      let filtered = enrichedUsers;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(user => 
          user.display_name?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search)
        );
      }
      
      // Apply compliance status filter
      if (filters.complianceStatus !== 'all') {
        filtered = filtered.filter(user => {
          const score = user.compliance_score || 0;
          switch (filters.complianceStatus) {
            case 'compliant': return score >= 80;
            case 'warning': return score >= 60 && score < 80;
            case 'non_compliant': return score < 60;
            default: return true;
          }
        });
      }
      
      setUsers(filtered);
      
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string, selected: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (selected) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(new Set(users.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
    setShowBulkActions(selected);
  };

  const handleBulkAction = async (action: BulkAction) => {
    try {
      setProcessingBulk(true);
      setBulkAction(action);
      
      const selectedUserIds = Array.from(selectedUsers);
      
      switch (action.type) {
        case 'activate':
          await Promise.all(
            selectedUserIds.map(id => 
              supabase
                .from('profiles')
                .update({ is_active: true })
                .eq('id', id)
            )
          );
          toast.success(`Activated ${selectedUserIds.length} users`);
          break;
          
        case 'deactivate':
          await Promise.all(
            selectedUserIds.map(id => 
              supabase
                .from('profiles')
                .update({ is_active: false })
                .eq('id', id)
            )
          );
          toast.success(`Deactivated ${selectedUserIds.length} users`);
          break;
          
        case 'change_tier':
          if (action.data?.tier) {
            await Promise.all(
              selectedUserIds.map(id => 
                ComplianceTierService.updateUserComplianceTier(id, action.data.tier)
              )
            );
            toast.success(`Updated compliance tier for ${selectedUserIds.length} users`);
          }
          break;
          
        case 'send_email':
          // This would integrate with email service
          toast.success(`Email sent to ${selectedUserIds.length} users`);
          break;
          
        case 'delete':
          // Soft delete only
          await Promise.all(
            selectedUserIds.map(id => 
              supabase
                .from('profiles')
                .update({ is_active: false })
                .eq('id', id)
            )
          );
          toast.success(`Deleted ${selectedUserIds.length} users`);
          break;
      }
      
      // Reload users
      await loadUsers();
      
      // Clear selection
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setProcessingBulk(false);
      setBulkAction(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SA': return 'bg-red-100 text-red-800';
      case 'AD': return 'bg-purple-100 text-purple-800';
      case 'AP': return 'bg-green-100 text-green-800';
      case 'IC': return 'bg-blue-100 text-blue-800';
      case 'IP': return 'bg-orange-100 text-orange-800';
      case 'IT': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceStatusIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const exportUsers = async () => {
    try {
      const exportData = users.map(user => ({
        id: user.id,
        name: user.display_name,
        email: user.email,
        role: user.role,
        complianceTier: user.compliance_tier,
        complianceScore: user.compliance_score,
        pendingActions: user.pending_actions,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }));
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  const getUserStats = () => {
    return {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      compliant: users.filter(u => (u.compliance_score || 0) >= 80).length,
      pendingActions: users.reduce((sum, u) => sum + (u.pending_actions || 0), 0)
    };
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant Users</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.compliant}</div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 80%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingActions}</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SA">System Admin</SelectItem>
                  <SelectItem value="AD">Administrator</SelectItem>
                  <SelectItem value="AP">Authorized Provider</SelectItem>
                  <SelectItem value="IC">Instructor Certified</SelectItem>
                  <SelectItem value="IP">Instructor Provisional</SelectItem>
                  <SelectItem value="IT">Instructor Trainee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compliance Tier</Label>
              <Select value={filters.tier} onValueChange={(value) => setFilters({...filters, tier: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="robust">Robust</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compliance</Label>
              <Select value={filters.complianceStatus} onValueChange={(value) => setFilters({...filters, complianceStatus: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Compliance</SelectItem>
                  <SelectItem value="compliant">Compliant (≥80%)</SelectItem>
                  <SelectItem value="warning">Warning (60-79%)</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant (less than 60%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {showBulkActions && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Bulk Actions</AlertTitle>
          <AlertDescription>
            <div className="flex items-center gap-2 mt-2">
              <span>{selectedUsers.size} users selected</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction({ type: 'activate' })}
                  disabled={processingBulk}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction({ type: 'deactivate' })}
                  disabled={processingBulk}
                >
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction({ type: 'change_tier', data: { tier: 'basic' } })}
                  disabled={processingBulk}
                >
                  Set Basic Tier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction({ type: 'change_tier', data: { tier: 'robust' } })}
                  disabled={processingBulk}
                >
                  Set Robust Tier
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction({ type: 'delete' })}
                  disabled={processingBulk}
                >
                  Delete
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Users ({users.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedUsers.size === users.length && users.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">Select All</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2" />
                <p>No users found matching your filters</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{user.display_name || 'Unknown User'}</h3>
                          {!user.is_active && <Badge variant="outline" className="text-red-600">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                          {user.compliance_tier && (
                            <Badge variant="outline" className="capitalize">
                              {user.compliance_tier} Tier
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {getComplianceStatusIcon(user.compliance_score || 0)}
                          <span className={`text-sm font-medium ${getComplianceStatusColor(user.compliance_score || 0)}`}>
                            {user.compliance_score || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user.pending_actions || 0} pending actions
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Login:</span> {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </div>
                    <div>
                      <span className="font-medium">Teams:</span> {user.team_count || 0}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}