
import React from 'react';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import { UserTableRow } from './UserTableRow';
import { ExtendedProfile } from '@/types/supabase-schema';
import { EditUserDialog } from './dialogs/EditUserDialog';
import { ResetPasswordDialog } from './dialogs/ResetPasswordDialog';
import { ChangeRoleDialog } from './dialogs/ChangeRoleDialog';

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
  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow border border-muted/30 bg-card/60 animate-fade-in">
          <Table>
            <TableCaption>A list of all users in your account.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
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
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditUserDialog {...dialogHandlers} />
      <ResetPasswordDialog {...dialogHandlers} />
      <ChangeRoleDialog {...dialogHandlers} />
    </>
  );
}
