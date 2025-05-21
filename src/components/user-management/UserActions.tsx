
import React, { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UserActionsProps {
  user: ExtendedUser;
}

export function UserActions({ user }: UserActionsProps) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleViewDetails = () => {
    // This would typically open a dialog or navigate to a user details page
    toast.info(`Viewing details for ${user.display_name || user.email}`);
    // Implementation would depend on navigation and UI structure
  };

  const handleEditUser = () => {
    // This would typically open an edit user dialog
    toast.info(`Editing user ${user.display_name || user.email}`);
    // Implementation would depend on dialog component structure
  };

  const handleResetPassword = async () => {
    try {
      setIsProcessing(true);
      // This is a placeholder - actual implementation would use Supabase auth functions
      // In a real implementation, this would trigger a password reset email
      const { error } = await supabase.auth.admin.resetPasswordForEmail(user.email);
      
      if (error) throw error;
      
      toast.success(`Password reset email has been sent to ${user.email}`);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(`Failed to reset password: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeRole = () => {
    // This would typically open a change role dialog
    toast.info(`Changing role for ${user.display_name || user.email}`);
    // Implementation would depend on dialog component structure
  };

  const handleToggleStatus = async () => {
    try {
      setIsProcessing(true);
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Invalidate queries to refresh the users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast.success(`User ${user.display_name || user.email} is now ${newStatus.toLowerCase()}`);
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error(`Failed to update user status: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer" onClick={handleViewDetails}>
          <Eye className="mr-2 h-4 w-4" />
          <span>View Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={handleEditUser}>
          <UserCog className="mr-2 h-4 w-4" />
          <span>Edit User</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={handleResetPassword} disabled={isProcessing}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Reset Password</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleChangeRole}>
          <Shield className="mr-2 h-4 w-4" />
          <span>Change Role</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.status === 'ACTIVE' ? (
          <DropdownMenuItem 
            className="cursor-pointer text-red-600" 
            onClick={handleToggleStatus} 
            disabled={isProcessing}
          >
            <ShieldAlert className="mr-2 h-4 w-4" />
            <span>Deactivate</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            className="cursor-pointer text-green-600" 
            onClick={handleToggleStatus} 
            disabled={isProcessing}
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Activate</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
