import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Power, PowerOff, Key, Shield, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { ExtendedProfile, UserRole } from '@/types/supabase-schema';

interface UserTableRowProps {
  user: ExtendedProfile;
  isSelected: boolean;
  onSelect: (userId: string, selected: boolean) => void;
  onEdit: (user: ExtendedProfile) => void;
  onActivate: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onResetPassword: (user: ExtendedProfile) => void;
  onChangeRole: (user: ExtendedProfile) => void;
  onViewDetail: (user: ExtendedProfile) => void;
  canManageUsers: boolean;
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
  onViewDetail,
  canManageUsers
}: UserTableRowProps) {
  
  const handleRoleChange = () => {
    // Use UserRole instead of DatabaseUserRole
    onChangeRole(user);
  };

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(user.id, !!checked)}
        />
      </TableCell>
      <TableCell>{user.display_name || 'Unnamed User'}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant="outline">{user.role}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {user.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={user.compliance_status ? 'default' : 'destructive'}>
          {user.compliance_status ? 'Compliant' : 'Non-compliant'}
        </Badge>
      </TableCell>
      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onViewDetail(user)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {canManageUsers && (
              <>
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRoleChange}>
                  <Shield className="h-4 w-4 mr-2" />
                  Change Role
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onResetPassword(user)}>
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </DropdownMenuItem>
                {user.status === 'ACTIVE' ? (
                  <DropdownMenuItem onClick={() => onDeactivate(user.id)}>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onActivate(user.id)}>
                    <Power className="h-4 w-4 mr-2" />
                    Activate
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
