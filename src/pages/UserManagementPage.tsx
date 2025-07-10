
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
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await processCSVImport(file);
      }
    };
    input.click();
  };

  const processCSVImport = async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Read file content
      const fileContent = await file.text();
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must contain at least a header row and one data row');
        return;
      }

      // Parse CSV headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredFields = ['email', 'display_name', 'role'];
      
      // Validate required columns exist
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      if (missingFields.length > 0) {
        toast.error(`Missing required columns: ${missingFields.join(', ')}`);
        return;
      }

      // Parse data rows
      const users = [];
      const errors = [];
      const validRoles = ['IT', 'IC', 'IP', 'AP', 'AM', 'SM'] as UserRole[];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const userData: any = {};
        headers.forEach((header, index) => {
          userData[header] = values[index];
        });

        // Validate email
        if (!userData.email || !userData.email.includes('@')) {
          errors.push(`Row ${i + 1}: Invalid email address`);
          continue;
        }

        // Validate role
        if (!validRoles.includes(userData.role as UserRole)) {
          errors.push(`Row ${i + 1}: Invalid role '${userData.role}'. Must be one of: ${validRoles.join(', ')}`);
          continue;
        }

        // Validate display name
        if (!userData.display_name || userData.display_name.length < 2) {
          errors.push(`Row ${i + 1}: Display name must be at least 2 characters`);
          continue;
        }

        users.push({
          email: userData.email,
          display_name: userData.display_name,
          role: userData.role as UserRole,
          status: userData.status || 'ACTIVE',
          compliance_status: userData.compliance_status === 'true' || userData.compliance_status === '1' || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} validation errors found. Please fix your CSV file.`);
        console.error('CSV Import Errors:', errors);
        return;
      }

      if (users.length === 0) {
        toast.error('No valid users found in CSV file');
        return;
      }

      // Show processing progress
      toast.success(`Processing ${users.length} users...`);

      // Batch insert users to Supabase
      let successCount = 0;
      let failureCount = 0;
      const batchSize = 10;

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .insert(batch)
            .select();

          if (error) {
            console.error('Batch insert error:', error);
            failureCount += batch.length;
            
            // Try individual inserts for this batch to identify conflicts
            for (const user of batch) {
              try {
                const { error: individualError } = await supabase
                  .from('profiles')
                  .insert([user])
                  .select();
                
                if (individualError) {
                  if (individualError.code === '23505') { // Unique constraint violation
                    console.warn(`User ${user.email} already exists, skipping`);
                  } else {
                    console.error(`Failed to insert ${user.email}:`, individualError);
                  }
                  failureCount++;
                } else {
                  successCount++;
                }
              } catch (err) {
                console.error(`Error inserting ${user.email}:`, err);
                failureCount++;
              }
            }
          } else {
            successCount += batch.length;
          }
        } catch (batchError) {
          console.error('Batch processing error:', batchError);
          failureCount += batch.length;
        }
      }

      // Log import activity
      try {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            activity_type: 'bulk_import',
            details: {
              total_processed: users.length,
              successful_imports: successCount,
              failed_imports: failureCount,
              filename: file.name
            },
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.warn('Failed to log import activity:', logError);
      }

      // Show results
      if (successCount > 0 && failureCount === 0) {
        toast.success(`Successfully imported ${successCount} users`);
      } else if (successCount > 0 && failureCount > 0) {
        toast.success(`Imported ${successCount} users, ${failureCount} failed (likely duplicates)`);
      } else {
        toast.error(`Import failed: ${failureCount} users could not be imported`);
      }

      // Refresh user list
      loadUsers();

    } catch (error: any) {
      console.error('CSV import error:', error);
      toast.error('Failed to process CSV file: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
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
