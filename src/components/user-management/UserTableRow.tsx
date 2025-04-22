import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, User as UserIcon, UserCog } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Profile } from '@/types/supabase-schema';
import { UserCredentialsHoverCard } from './UserCredentialsHoverCard';
import { hasRequiredRole } from '@/utils/roleUtils';

interface UserTableRowProps {
  user: Profile;
  isSelected: boolean;
  onSelect: (userId: string, selected: boolean) => void;
  onEdit: (userId: string) => void;
  onActivate: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  onChangeRole: (userId: string) => void;
  canManageUsers?: boolean;
  onViewDetail?: (userId: string) => void;
}

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0] || "";
    return parts[0][0] + (parts[1]?.[0] || "");
  }
  if (email) return email[0]?.toUpperCase() || "U";
  return "U";
}

export function UserTableRow({
  user,
  isSelected,
  onSelect,
  onEdit,
  onActivate,
  onDeactivate,
  onResetPassword,
  onChangeRole,
  canManageUsers = false,
  onViewDetail
}: UserTableRowProps) {
  const handleSelectChange = (checked: boolean) => {
    onSelect(user.id, checked);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const roleNames: Record<string, string> = {
    'IT': 'Instructor Trainee',
    'IP': 'Instructor Provisional',
    'IC': 'Instructor Certified',
    'AP': 'Admin Provisional',
    'AD': 'Administrator',
    'SA': 'System Admin'
  };

  const isAdmin = hasRequiredRole(user.role, 'AD');

  const userStatus = user.status || 'ACTIVE';

  return (
    <tr 
      className={`border-b transition-colors hover:bg-muted/50 
        ${isSelected ? 'bg-muted' : 'bg-white dark:bg-background'}
        text-foreground`}
    >
      <td className="p-4">
        <Checkbox checked={isSelected} onCheckedChange={handleSelectChange} />
      </td>
      <td className="p-4 font-medium flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold text-base uppercase ring-2 ring-primary/30 shadow-sm select-none">
          {getInitials(user.display_name, user.email)}
        </span>
        {user.display_name || 'No Name'}
      </td>
      <td className="p-4">{user.email || 'No Email'}</td>
      <td className="p-4">
        <Badge variant={user.role === 'SA' ? 'destructive' : isAdmin ? 'secondary' : 'outline'} className="capitalize">
          {roleNames[user.role] || user.role}
        </Badge>
      </td>
      <td className="p-4">
        <Badge variant={userStatus === 'ACTIVE' ? 'default' : 'outline'} className="capitalize">
          {userStatus}
        </Badge>
      </td>
      <td className="p-4">
        {formatDate(user.created_at)}
      </td>
      <td className="p-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 bg-background border shadow-xl">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetail && onViewDetail(user.id)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(user.id)}>
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canManageUsers && <>
              {userStatus === 'INACTIVE' ?
                <DropdownMenuItem onClick={() => onActivate(user.id)}>
                  Activate User
                </DropdownMenuItem>
                : <DropdownMenuItem onClick={() => onDeactivate(user.id)}>
                  Deactivate User
                </DropdownMenuItem>
              }
              <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangeRole(user.id)}>
                <UserCog className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuItem>
            </>}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
