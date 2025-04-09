
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Shield, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}: UserTableRowProps) {
  const handleSelectChange = (checked: boolean) => {
    onSelect(user.id, checked);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Map role abbreviations to full names
  const roleNames: Record<string, string> = {
    'IT': 'Instructor Trainee',
    'IP': 'Instructor Provisional',
    'IC': 'Instructor Certified',
    'AP': 'Admin Provisional',
    'AD': 'Administrator',
    'SA': 'System Admin'
  };

  // Determine if the user is an admin
  const isAdmin = hasRequiredRole(user.role, 'AD');
  
  // Default status to ACTIVE if not present
  const userStatus = user.status || 'ACTIVE';

  return (
    <tr className={`border-b transition-colors hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}>
      <td className="p-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleSelectChange}
        />
      </td>
      <td className="p-4 font-medium">{user.display_name || 'No Name'}</td>
      <td className="p-4">{user.email || 'No Email'}</td>
      <td className="p-4">
        <Badge variant={user.role === 'SA' ? 'destructive' : 
               isAdmin ? 'secondary' : 'outline'} 
               className="capitalize">
          {roleNames[user.role] || user.role}
        </Badge>
      </td>
      <td className="p-4">
        <Badge variant={userStatus === 'ACTIVE' ? 'default' : 'outline'} 
               className="capitalize">
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
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(user.id)}>
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canManageUsers && (
              <>
                {userStatus === 'INACTIVE' ? (
                  <DropdownMenuItem onClick={() => onActivate(user.id)}>
                    Activate User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onDeactivate(user.id)}>
                    Deactivate User
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onChangeRole(user.id)}>
                  <UserCog className="mr-2 h-4 w-4" />
                  Change Role
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
