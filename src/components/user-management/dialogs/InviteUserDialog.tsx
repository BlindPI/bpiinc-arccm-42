
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleError } from '@/utils/error-handler';
import { UserRole } from '@/types/supabase-schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import { InvitationResult } from '@/types/user-management';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSent: () => void;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  onInviteSent
}: InviteUserDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('IT');
  
  const inviteUser = useMutation({
    mutationFn: async (): Promise<InvitationResult> => {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, role, type: 'INVITE' }
      });
      
      if (error) throw error;
      return data as InvitationResult;
    },
    onSuccess: (data) => {
      toast.success(`User invitation sent to ${data.email}`);
      setEmail('');
      setRole('IT');
      onOpenChange(false);
      onInviteSent();
    },
    onError: (error) => {
      handleError(error, { context: 'User invitation' });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteUser.mutate();
  };
  
  const isFormValid = email.trim().length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new user to the system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="col-span-3"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Initial Role
            </label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SA">System Admin</SelectItem>
                <SelectItem value="AD">Administrator</SelectItem>
                <SelectItem value="FA">Full Instructor</SelectItem>
                <SelectItem value="SI">Student Instructor</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The user will be assigned this role initially.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteUser.isPending || !isFormValid}
            >
              {inviteUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
