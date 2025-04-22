import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CheckSquare, Download, Mail, Shield, UserCog, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface BulkActionsMenuProps {
  selectedUsers: string[];
  onSuccess: () => void;
}

export function BulkActionsMenu({ selectedUsers, onSuccess }: BulkActionsMenuProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>("");
  const [confirmTitle, setConfirmTitle] = useState<string>("");
  const [confirmDescription, setConfirmDescription] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast.warning("No users selected. Please select users first.");
      return;
    }
    
    switch (action) {
      case "email":
        setConfirmTitle("Send Email to Selected Users");
        setConfirmDescription(`Are you sure you want to send an email to ${selectedUsers.length} selected users?`);
        break;
      case "verify":
        setConfirmTitle("Mark Users as Compliant");
        setConfirmDescription(`Are you sure you want to mark ${selectedUsers.length} users as compliant?`);
        break;
      case "mark-non-compliant":
        setConfirmTitle("Mark Users as Non-Compliant");
        setConfirmDescription(`Are you sure you want to mark ${selectedUsers.length} users as non-compliant?`);
        break;
      case "export":
        // No confirmation needed for export
        handleExportUsers();
        return;
      case "deactivate":
        setConfirmTitle("Deactivate Selected Users");
        setConfirmDescription(`Are you sure you want to deactivate ${selectedUsers.length} selected users? This will prevent them from logging in.`);
        break;
      default:
        return;
    }
    
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const executeAction = async () => {
    setIsProcessing(true);
    try {
      console.log(`Executing action ${confirmAction} for ${selectedUsers.length} users`);
      
      let result;
      switch (confirmAction) {
        case "email":
          result = await sendBulkEmail();
          break;
        case "verify":
          result = await markUsersAsCompliant();
          break;
        case "mark-non-compliant":
          result = await markUsersAsNonCompliant();
          break;
        case "deactivate":
          result = await deactivateUsers();
          break;
      }
      
      onSuccess(); // Refresh user list
      
      if (result && result.error) {
        throw result.error;
      }
      
      toast.success(`Action completed for ${selectedUsers.length} users`);
    } catch (error: any) {
      console.error(`Error executing ${confirmAction}:`, error);
      toast.error(`Failed to complete action: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  const sendBulkEmail = async () => {
    // In a real implementation, this would send emails to selected users
    // For now, we'll simulate a delay and return success
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  const markUsersAsCompliant = async () => {
    console.log("Marking users as compliant:", selectedUsers);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        compliance_status: true,
        updated_at: new Date().toISOString()
      })
      .in('id', selectedUsers)
      .select();
      
    console.log("Update result:", { data, error });
    
    if (error) return { error };
    return { data };
  };

  const markUsersAsNonCompliant = async () => {
    console.log("Marking users as non-compliant:", selectedUsers);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        compliance_status: false,
        updated_at: new Date().toISOString()
      })
      .in('id', selectedUsers)
      .select();
      
    console.log("Update result:", { data, error });
    
    if (error) return { error };
    return { data };
  };

  const deactivateUsers = async () => {
    console.log("Deactivating users:", selectedUsers);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        status: 'INACTIVE',
        updated_at: new Date().toISOString()
      })
      .in('id', selectedUsers)
      .select();
      
    console.log("Update result:", { data, error });
    
    if (error) return { error };
    return { data };
  };

  const handleExportUsers = async () => {
    try {
      setIsProcessing(true);
      console.log("Exporting users:", selectedUsers);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', selectedUsers);
        
      if (error) throw error;
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${selectedUsers.length} users successfully`);
    } catch (error: any) {
      console.error('Error exporting users:', error);
      toast.error(`Failed to export users: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 shadow ring-1 ring-primary/10">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span>{selectedUsers.length} Selected</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 bg-white shadow-2xl border">
          <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction("email")}>
            <Mail className="mr-2 h-4 w-4 text-blue-400" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("verify")}>
            <Shield className="mr-2 h-4 w-4 text-green-500" />
            Mark as Compliant
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("mark-non-compliant")}>
            <Shield className="mr-2 h-4 w-4 text-orange-400" />
            Mark as Non-Compliant
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("export")}>
            <Download className="mr-2 h-4 w-4 text-purple-500" />
            Export Users
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction("deactivate")} className="text-destructive font-semibold">
            <UserCog className="mr-2 h-4 w-4" />
            Deactivate Users
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isProcessing} onClick={(e) => { 
              e.preventDefault();
              executeAction();
            }}>
              {isProcessing ? "Processing..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
