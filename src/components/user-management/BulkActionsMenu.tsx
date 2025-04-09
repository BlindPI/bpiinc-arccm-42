
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CheckSquare, Download, Mail, Shield, UserCog } from "lucide-react";
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
    switch (action) {
      case "email":
        setConfirmTitle("Send Email to Selected Users");
        setConfirmDescription(`Are you sure you want to send an email to ${selectedUsers.length} selected users?`);
        break;
      case "verify":
        setConfirmTitle("Mark Users as Compliant");
        setConfirmDescription(`Are you sure you want to mark ${selectedUsers.length} users as compliant?`);
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
      switch (confirmAction) {
        case "email":
          await sendBulkEmail();
          break;
        case "verify":
          await markUsersAsCompliant();
          break;
        case "deactivate":
          await deactivateUsers();
          break;
      }
      
      onSuccess();
      toast.success(`Action completed successfully for ${selectedUsers.length} users`);
    } catch (error: any) {
      console.error(`Error executing ${confirmAction}:`, error);
      toast.error(`Failed to complete action: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  const sendBulkEmail = async () => {
    // This would call an edge function to send emails
    // For now, we'll just simulate success
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  const markUsersAsCompliant = async () => {
    // Update compliance status in profiles table
    await supabase
      .from('profiles')
      .update({ 
        compliance_status: true,
        updated_at: new Date().toISOString()
      })
      .in('id', selectedUsers);
  };

  const deactivateUsers = async () => {
    // Update status in profiles table
    await supabase
      .from('profiles')
      .update({ 
        status: 'INACTIVE',
        updated_at: new Date().toISOString()
      })
      .in('id', selectedUsers);
  };

  const handleExportUsers = async () => {
    try {
      setIsProcessing(true);
      
      // Fetch full profile data for selected users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', selectedUsers);
      
      if (error) throw error;
      
      // Convert to CSV
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      
      const csv = [headers, ...rows].join('\n');
      
      // Create download
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
          <Button variant="outline" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            <span>{selectedUsers.length} Selected</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction("email")}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("verify")}>
            <Shield className="mr-2 h-4 w-4" />
            Mark as Compliant
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("export")}>
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction("deactivate")} className="text-destructive">
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
