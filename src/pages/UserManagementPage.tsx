import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/utils/routeUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { UserRole } from '@/lib/roles';
import { ROLE_LABELS } from '@/lib/roles';
import { Loader2, Search, UserPlus, UserCog, KeyRound, ShieldCheck, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// User Management page component
const UserManagementPage = () => {
  const { user, loading, authReady } = useAuth();

  return (
    <ProtectedRoute user={user} loading={loading} authReady={authReady}>
      <DashboardLayout>
        <UserManagementContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

// Separate content component to keep the main component focused on route protection
const UserManagementContent = () => {
  const {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    handleSelectUser,
    handleEditClick,
    handleResetPasswordClick,
    handleChangeRoleClick,
    handleActivateUser,
    handleDeactivateUser,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editFormData,
    handleEditFormChange,
    handleEditSubmit,
    isProcessing,
    isResetPasswordDialogOpen,
    setIsResetPasswordDialogOpen,
    handleResetPasswordConfirm,
    resetPasswordUserId,
    isChangeRoleDialogOpen,
    setIsChangeRoleDialogOpen,
    handleChangeRoleConfirm,
    handleRoleChange,
    changeRoleUserId,
    newRole,
    isDetailDialogOpen,
    setIsDetailDialogOpen,
    handleViewUserDetail,
    handleCloseUserDetail,
    detailUserId
  } = useUserManagement();

  // Get the detailed user for the dialog
  const detailedUser = users.find(user => user.id === detailUserId);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    return (
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role && ROLE_LABELS[user.role as UserRole]?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-[250px]"
            />
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user access and roles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.display_name || 'No name'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-100">
                            {user.role ? ROLE_LABELS[user.role as UserRole] : 'No role'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.status === 'ACTIVE' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewUserDetail(user.id)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditClick(user.id)}
                            >
                              <UserCog className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleChangeRoleClick(user.id)}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              Role
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResetPasswordClick(user.id)}
                            >
                              <KeyRound className="h-3.5 w-3.5 mr-1" />
                              Reset
                            </Button>
                            {user.status === 'ACTIVE' ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeactivateUser(user.id)}
                                className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Deactivate
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleActivateUser(user.id)}
                                className="border-green-200 bg-green-50 hover:bg-green-100 text-green-800"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No users found matching your search criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="display_name" className="text-sm font-medium">Display Name</label>
              <Input
                id="display_name"
                name="display_name"
                value={editFormData.display_name || ''}
                onChange={handleEditFormChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              This will send a password reset email to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to reset the password for this user?</p>
            <p className="text-sm text-gray-500 mt-2">
              The user will receive an email with instructions to set a new password.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPasswordConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Email'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Select a new role for this user
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <Button
                  key={role}
                  type="button"
                  variant={newRole === role ? "default" : "outline"}
                  className={newRole === role ? "border-2 border-primary" : ""}
                  onClick={() => handleRoleChange(role as UserRole)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeRoleDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRoleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {detailedUser && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">Name:</div>
                  <div>{detailedUser.display_name || 'Not set'}</div>
                  
                  <div className="text-sm font-medium">Email:</div>
                  <div>{detailedUser.email}</div>
                  
                  <div className="text-sm font-medium">Role:</div>
                  <div>{ROLE_LABELS[detailedUser.role as UserRole] || 'Not assigned'}</div>
                  
                  <div className="text-sm font-medium">Status:</div>
                  <div>
                    {detailedUser.status === 'ACTIVE' ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm font-medium">Compliance:</div>
                  <div>
                    {detailedUser.compliance_status ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Compliant
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Non-compliant
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm font-medium">Created:</div>
                  <div>{new Date(detailedUser.created_at).toLocaleDateString()}</div>
                  
                  <div className="text-sm font-medium">Last Updated:</div>
                  <div>{new Date(detailedUser.updated_at).toLocaleDateString()}</div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCloseUserDetail}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;
