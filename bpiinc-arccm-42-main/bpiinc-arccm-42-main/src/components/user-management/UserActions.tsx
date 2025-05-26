
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserCog, Mail, ShieldAlert, Shield, Eye } from 'lucide-react';
import { ExtendedUser } from '@/types/courses';

interface UserActionsProps {
  user: ExtendedUser;
}

export function UserActions({ user }: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer" onClick={() => {}}>
          <Eye className="mr-2 h-4 w-4" />
          <span>View Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => {}}>
          <UserCog className="mr-2 h-4 w-4" />
          <span>Edit User</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => {}}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Reset Password</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => {}}>
          <Shield className="mr-2 h-4 w-4" />
          <span>Change Role</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.status === 'ACTIVE' ? (
          <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => {}}>
            <ShieldAlert className="mr-2 h-4 w-4" />
            <span>Deactivate</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className="cursor-pointer text-green-600" onClick={() => {}}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Activate</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
