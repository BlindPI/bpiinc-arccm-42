
import { TableCell, TableRow } from "@/components/ui/table";
import { Profile } from "@/types/user-management";
import { UserCredentialsHoverCard } from "./UserCredentialsHoverCard";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/roles";
import { Check, X, MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { UserRole } from "@/types/supabase-schema";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserTableRowProps {
  profile: Profile;
  showCredentials: boolean;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onStatusChange?: () => void;
}

export function UserTableRow({ 
  profile, 
  showCredentials, 
  isSelected = false, 
  onSelect, 
  onStatusChange 
}: UserTableRowProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const toggleUserStatus = async (activate: boolean) => {
    try {
      setIsUpdatingStatus(true);
      const status = activate ? 'ACTIVE' : 'INACTIVE';
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast.success(`User status updated to ${status.toLowerCase()}`);
      if (onStatusChange) onStatusChange();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error(`Failed to update user status: ${error.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <TableRow className={isSelected ? "bg-muted/50" : undefined}>
      <TableCell>
        {onSelect && (
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onSelect}
            aria-label={`Select ${profile.display_name || 'user'}`}
          />
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{profile.display_name || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground">{profile.email || profile.id}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {ROLE_LABELS[profile.role as UserRole] || profile.role}
        </Badge>
      </TableCell>
      <TableCell>
        {profile.status === 'INACTIVE' ? (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3.5 w-3.5" />
            Inactive
          </Badge>
        ) : (
          <Badge variant="success" className="gap-1">
            <Check className="h-3.5 w-3.5" />
            Active
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {profile.compliance_status ? (
          <Badge variant="success">Compliant</Badge>
        ) : (
          <Badge variant="destructive">Non-Compliant</Badge>
        )}
      </TableCell>
      <TableCell>
        {profile.updated_at ? (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Unknown</span>
        )}
      </TableCell>
      {showCredentials && (
        <TableCell>
          <div className="flex items-center justify-end space-x-2">
            {profile.credentials && <UserCredentialsHoverCard credentials={profile.credentials} />}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {profile.status === 'INACTIVE' ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate User
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Activate User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to activate this user? They will be able to sign in again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => toggleUserStatus(true)}
                          disabled={isUpdatingStatus}
                        >
                          {isUpdatingStatus ? "Processing..." : "Activate"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate User
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to deactivate this user? They will not be able to sign in until reactivated.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => toggleUserStatus(false)}
                          disabled={isUpdatingStatus}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isUpdatingStatus ? "Processing..." : "Deactivate"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
