import React from 'react';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, User as UserIcon, Search as SearchIcon, Users as UsersIcon } from 'lucide-react';
import { UserTableRow } from './UserTableRow';
import { ExtendedProfile } from '@/types/user-management';
import { EditUserDialog } from './dialogs/EditUserDialog';
import { ResetPasswordDialog } from './dialogs/ResetPasswordDialog';
import { ChangeRoleDialog } from './dialogs/ChangeRoleDialog';
import { UserDetailDialog } from './dialogs/UserDetailDialog';

type Props = {
  users: ExtendedProfile[];
  loading: boolean;
  error: string | null;
  selectedUsers: string[];
  onSelectUser: (userId: string, selected: boolean) => void;
  dialogHandlers: any;
  isAdmin: boolean;
};

export function UserTable({
  users,
  loading,
  error,
  selectedUsers,
  onSelectUser,
  dialogHandlers,
  isAdmin,
}: Props) {
  // Helper: empty state illustration (icon + text)
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <UsersIcon className="h-12 w-12 text-muted-foreground/40 mb-2" />
      <h2 className="text-xl font-semibold text-muted-foreground mb-1">No users found</h2>
      <p className="text-sm text-muted-foreground mb-3 text-center max-w-md">
        There are no users matching your current filters. <br />
        Try adjusting your search or role filter above.
      </p>
    </div>
  );

  // Helper: error state
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <span className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-full font-medium border border-red-300 shadow-sm">
        <SearchIcon className="w-4 h-4" />
        Error loading users
      </span>
      <div className="text-red-500 font-medium text-sm">{error}</div>
    </div>
  );

  // Find the currently selected user for the detail dialog
  const detailUser =
    dialogHandlers.detailUserId ? users.find(u => u.id === dialogHandlers.detailUserId) : null;

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <ErrorState />
      ) : users.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-xl border border-muted/40 bg-card/90 animate-fade-in transition-all">
          <Table>
            <TableCaption className="text-base py-3 text-muted-foreground">
              A list of all users in your account.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  isSelected={selectedUsers.includes(user.id)}
                  onSelect={onSelectUser}
                  onEdit={dialogHandlers.handleEditClick}
                  onActivate={dialogHandlers.handleActivateUser}
                  onDeactivate={dialogHandlers.handleDeactivateUser}
                  onResetPassword={dialogHandlers.handleResetPasswordClick}
                  onChangeRole={dialogHandlers.handleChangeRoleClick}
                  canManageUsers={isAdmin}
                  onViewDetail={dialogHandlers.handleViewUserDetail}
                  showTierManagerInModal={dialogHandlers.handleShowTierManager}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditUserDialog {...dialogHandlers} />
      <ResetPasswordDialog {...dialogHandlers} />
      <ChangeRoleDialog {...dialogHandlers} />
      <UserDetailDialog 
        open={dialogHandlers.isDetailDialogOpen} 
        onOpenChange={open => {
          if (!open) dialogHandlers.handleCloseUserDetail();
        }}
        user={detailUser}
        isAdmin={isAdmin}
      />
    </>
  );
}
