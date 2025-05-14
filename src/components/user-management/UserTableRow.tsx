
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, UserCog, UserCheck, UserX, KeyRound, ShieldAlert, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ExtendedProfile } from '@/types/supabase-schema';
import { format } from 'date-fns';
import { UserCredentialsHoverCard } from './UserCredentialsHoverCard';
import { cn } from '@/lib/utils';

interface UserTableRowProps {
  user: ExtendedProfile;
  isSelected: boolean;
  onSelect: (userId: string, selected: boolean) => void;
  onEdit: (userId: string) => void;
  onActivate: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  onChangeRole: (userId: string) => void;
  onViewDetail: (userId: string) => void;
  canManageUsers: boolean;
}

export const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  isSelected,
  onSelect,
  onEdit,
  onActivate,
  onDeactivate,
  onResetPassword,
  onChangeRole,
  canManageUsers,
  onViewDetail
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Determine badge variant based on user status
  const getBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      case 'PENDING':
        return 'warning';
      default:
        return 'outline';
    }
  };

  // Determine role display name
  const getRoleDisplay = (role: string) => {
    const roles: Record<string, string> = {
      'SA': 'System Admin',
      'AD': 'Administrator',
      'AP': 'Auth Provider',
      'IC': 'Instructor',
      'IT': 'Instructor Trainee',
      'IP': 'Independent Provider',
      'CM': 'Client Manager',
      'CU': 'Client User'
    };
    
    return roles[role] || role;
  };

  return (
    <TableRow className={isSelected ? 'bg-muted/50' : undefined}>
      <TableCell className="py-2">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={(checked) => onSelect(user.id, !!checked)} 
          aria-label="Select row"
        />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.display_name || 'No Name'}</span>
        </div>
      </TableCell>
      <TableCell>
        <UserCredentialsHoverCard email={user.email || ''} userId={user.id}>
          <span className="text-muted-foreground cursor-pointer underline-offset-4 hover:underline">
            {user.email}
          </span>
        </UserCredentialsHoverCard>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-medium bg-primary/5 text-primary">
          {getRoleDisplay(user.role)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={getBadgeVariant(user.status)}>
          {user.status}
        </Badge>
      </TableCell>
      {/* Compliance Column */}
      <TableCell>
        <Badge variant={user.compliance_status ? "success" : "warning"}>
          {user.compliance_status ? "Compliant" : "Non-Compliant"}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(user.created_at)}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetail(user.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {canManageUsers && (
              <>
                <DropdownMenuItem onClick={() => onEdit(user.id)}>
                  <UserCog className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.status === 'ACTIVE' ? (
                  <DropdownMenuItem onClick={() => onDeactivate(user.id)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onActivate(user.id)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeRole(user.id)}>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Change Role
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
