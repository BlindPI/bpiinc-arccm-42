
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/supabase-schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Upload, Download, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { InviteUserDialog } from "@/components/user-management/InviteUserDialog";
import { BulkActionsMenu } from "@/components/user-management/BulkActionsMenu";
import { FilterBar } from "@/components/user-management/FilterBar";
import { ComplianceStats } from "@/components/user-management/ComplianceStats";
import { UserTable } from "@/components/user-management/UserTable";
import { UserManagementMetricsHeader } from "@/components/user-management/dashboard/UserManagementMetricsHeader";
import { UserManagementNavigationCards } from "@/components/user-management/navigation/UserManagementNavigationCards";
import { EnhancedUserTable } from "@/components/user-management/enhanced/EnhancedUserTable";
import { EditUserDialog } from "@/components/user-management/dialogs/EditUserDialog";
import { ResetPasswordDialog } from "@/components/user-management/dialogs/ResetPasswordDialog";
import { ChangeRoleDialog } from "@/components/user-management/dialogs/ChangeRoleDialog";
import { UserDetailDialog } from "@/components/user-management/dialogs/UserDetailDialog";
import { toast } from "sonner";
import { ExtendedProfile } from "@/types/supabase-schema";

export default function UserManagementPage() {
  // State Management
  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Dialog States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form States
  const [editFormData, setEditFormData] = useState<Partial<ExtendedProfile>>({});
  const [newRole, setNewRole] = useState<UserRole>("IT");

  const { toast: uiToast } = useToast();

  // Calculate metrics
  const activeUsers = users.filter(u => u.status === "ACTIVE").length;
  const pendingUsers = users.filter(u => u.status === "PENDING").length;
  const inactiveUsers = users.filter(u => u.status === "INACTIVE").length;
  const compliantUsers = users.filter(u => u.compliance_status === true).length;
  const complianceRate = users.length > 0 ? Math.round((compliantUsers / users.length) * 100) : 0;

  // Load Users Function
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const extendedUsers = profiles.map(profile => ({
        ...profile,
        id: profile.id,
        email: profile.email || '',
        display_name: profile.display_name || '',
        role: profile.role as UserRole,
        status: profile.status || 'ACTIVE',
        compliance_status: profile.compliance_status || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at || profile.created_at,
      })) as ExtendedProfile[];

      setUsers(extendedUsers);
    } catch (error: any) {
      console.error("Error loading users:", error.message);
      toast.error("Failed to load users: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Users Effect
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        (user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.role?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply role filter
    if (roleFilter && roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply compliance filter
    if (complianceFilter && complianceFilter !== "all") {
      if (complianceFilter === "compliant") {
        filtered = filtered.filter(user => user.compliance_status === true);
      } else if (complianceFilter === "non-compliant") {
        filtered = filtered.filter(user => user.compliance_status === false);
      }
    }

    // Apply tab filter
    if (activeTab !== "users") {
      filtered = filtered.filter(user => {
        switch (activeTab) {
          case "active":
            return user.status === "ACTIVE";
          case "pending":
            return user.status === "PENDING";
          case "inactive":
            return user.status === "INACTIVE";
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter, complianceFilter, activeTab]);

  // User Selection Handlers
  const handleSelectUser = (userId: string, selected: boolean) => {
    setSelectedUsers(prev => {
      if (selected) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  };

  // Dialog Handlers
  const handleEditClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setEditFormData({
        display_name: user.display_name,
        email: user.email,
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async () => {
    if (!selectedUserId) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editFormData)
        .eq('id', selectedUserId);

      if (error) throw error;

      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast.error("Failed to update user: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPasswordClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetPasswordConfirm = async () => {
    if (!selectedUserId) return;

    const user = users.find(u => u.id === selectedUserId);
    if (!user?.email) {
      toast.error("Cannot reset password: User has no email address");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset email sent successfully");
      setIsResetPasswordDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to send reset email: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeRoleClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setNewRole(user.role);
      setIsChangeRoleDialogOpen(true);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setNewRole(role);
  };

  const handleChangeRoleConfirm = async () => {
    if (!selectedUserId) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUserId);

      if (error) throw error;

      toast.success("User role updated successfully");
      setIsChangeRoleDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast.error("Failed to update role: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'ACTIVE' })
        .eq('id', userId);

      if (error) throw error;

      toast.success("User activated successfully");
      loadUsers();
    } catch (error: any) {
      toast.error("Failed to activate user: " + error.message);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'INACTIVE' })
        .eq('id', userId);

      if (error) throw error;

      toast.success("User deactivated successfully");
      loadUsers();
    } catch (error: any) {
      toast.error("Failed to deactivate user: " + error.message);
    }
  };

  const handleViewUserDetail = (userId: string) => {
    setDetailUserId(userId);
    setIsDetailDialogOpen(true);
  };

  const handleCloseUserDetail = () => {
    setDetailUserId(null);
    setIsDetailDialogOpen(false);
  };

  // Import/Export Handlers
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.success(`Processing ${file.name}...`);
        // TODO: Implement CSV/Excel import logic
      }
    };
    input.click();
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Compliance', 'Created'],
      ...filteredUsers.map(user => [
        user.display_name || '',
        user.email || '',
        user.role,
        user.status,
        user.compliance_status ? 'Compliant' : 'Non-compliant',
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredUsers.length} users to CSV`);
  };

  // Filter Handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
  };

  const handleComplianceFilterChange = (value: string) => {
    setComplianceFilter(value);
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setComplianceFilter("all");
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Find the currently selected user for the detail dialog
  const detailUser = detailUserId ? users.find(u => u.id === detailUserId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 space-y-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enterprise Header with Metrics */}
        <UserManagementMetricsHeader
          totalUsers={users.length}
          activeUsers={activeUsers}
          pendingUsers={pendingUsers}
          complianceRate={complianceRate}
          recentActivity={7} // Mock data
        />

        {/* Navigation Cards */}
        <UserManagementNavigationCards
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalUsers={users.length}
          activeUsers={activeUsers}
          pendingUsers={pendingUsers}
          inactiveUsers={inactiveUsers}
          complianceRate={complianceRate}
        />

        {/* Enhanced Content Area */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 p-6 sm:p-8">
          {/* Action Bar */}
          <div className="flex justify-between items-start gap-4 mb-6">
            <FilterBar
              onSearchChange={setSearchQuery}
              onRoleFilterChange={setRoleFilter}
              onComplianceFilterChange={setComplianceFilter}
              onClearAllFilters={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setComplianceFilter("all");
              }}
              searchValue={searchQuery}
              roleFilter={roleFilter}
              complianceFilter={complianceFilter}
              activeTags={[
                ...(searchQuery ? [{ key: 'search', label: `Search: "${searchQuery}"` }] : []),
                ...(roleFilter && roleFilter !== 'all' ? [{ key: 'role', label: `Role: ${roleFilter}` }] : []),
                ...(complianceFilter && complianceFilter !== 'all' ? [{ key: 'compliance', label: `Compliance: ${complianceFilter}` }] : []),
              ]}
            />
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <BulkActionsMenu
                selectedUsers={selectedUsers}
                onSuccess={loadUsers}
              />
              <InviteUserDialog />
              <Button variant="outline" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Enhanced Table/Cards View */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <EnhancedUserTable
              users={filteredUsers}
              selectedUsers={selectedUsers}
              onSelectUser={handleSelectUser}
              onEditUser={handleEditClick}
              onActivateUser={handleActivateUser}
              onDeactivateUser={handleDeactivateUser}
              onResetPassword={handleResetPasswordClick}
              onChangeRole={handleChangeRoleClick}
              onViewDetail={handleViewUserDetail}
              loading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Dialog Components - These were missing! */}
      <EditUserDialog
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        editFormData={editFormData}
        handleEditFormChange={handleEditFormChange}
        handleEditSubmit={handleEditSubmit}
        isProcessing={isProcessing}
      />

      <ResetPasswordDialog
        isResetPasswordDialogOpen={isResetPasswordDialogOpen}
        setIsResetPasswordDialogOpen={setIsResetPasswordDialogOpen}
        isProcessing={isProcessing}
        handleResetPasswordConfirm={handleResetPasswordConfirm}
      />

      <ChangeRoleDialog
        isChangeRoleDialogOpen={isChangeRoleDialogOpen}
        setIsChangeRoleDialogOpen={setIsChangeRoleDialogOpen}
        handleRoleChange={handleRoleChange}
        handleChangeRoleConfirm={handleChangeRoleConfirm}
        isProcessing={isProcessing}
        newRole={newRole}
      />

      <UserDetailDialog 
        open={isDetailDialogOpen} 
        onOpenChange={(open) => {
          if (!open) handleCloseUserDetail();
        }}
        user={detailUser}
        isAdmin={true}
      />
    </div>
  );
}
