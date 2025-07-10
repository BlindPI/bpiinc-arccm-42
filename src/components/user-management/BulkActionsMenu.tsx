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
import { UserRole } from "@/types/supabase-schema";
import { RoleSelector } from "./RoleSelector";

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
  const [bulkRole, setBulkRole] = useState<UserRole>("IT");
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const handleAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast.warning("No users selected. Please select users first.");
      return;
    }
    
    switch (action) {
      case "email":
        setConfirmTitle("Send Email to Selected Users");
        setConfirmDescription(`Are you sure you want to send an email to ${selectedUsers.length} selected users?`);
        setShowRoleSelector(false);
        break;
      case "verify":
        setConfirmTitle("Mark Users as Compliant");
        setConfirmDescription(`Are you sure you want to mark ${selectedUsers.length} users as compliant?`);
        setShowRoleSelector(false);
        break;
      case "mark-non-compliant":
        setConfirmTitle("Mark Users as Non-Compliant");
        setConfirmDescription(`Are you sure you want to mark ${selectedUsers.length} users as non-compliant?`);
        setShowRoleSelector(false);
        break;
      case "export":
        // No confirmation needed for export
        handleExportUsers();
        return;
      case "change-role":
        setConfirmTitle("Change Role for Selected Users");
        setConfirmDescription(`Select a role to assign to ${selectedUsers.length} selected users.`);
        setShowRoleSelector(true);
        break;
      case "deactivate":
        setConfirmTitle("Deactivate Selected Users");
        setConfirmDescription(`Are you sure you want to deactivate ${selectedUsers.length} selected users? This will prevent them from logging in.`);
        setShowRoleSelector(false);
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
        case "change-role":
          result = await changeBulkUserRoles();
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
    try {
      console.log("Sending bulk email to users:", selectedUsers);
      
      // First, fetch user details with emails
      const { data: users, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', selectedUsers)
        .not('email', 'is', null);
        
      if (fetchError) {
        throw fetchError;
      }
      
      if (!users || users.length === 0) {
        throw new Error('No users with valid email addresses found');
      }
      
      // Filter out users without email addresses
      const validUsers = users.filter(user => user.email && user.email.trim() !== '');
      
      if (validUsers.length === 0) {
        throw new Error('None of the selected users have valid email addresses');
      }
      
      // Create email batches to avoid overwhelming the email service
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < validUsers.length; i += batchSize) {
        batches.push(validUsers.slice(i, i + batchSize));
      }
      
      let totalSent = 0;
      let errors = [];
      
      // Process each batch
      for (const batch of batches) {
        try {
          // Call Supabase Edge Function for sending emails
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-bulk-email', {
            body: {
              recipients: batch.map(user => ({
                email: user.email,
                name: user.display_name || 'User'
              })),
              subject: 'Important Update from BPI Training System',
              template: 'bulk-notification',
              metadata: {
                sender_type: 'admin',
                batch_id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                total_recipients: validUsers.length
              }
            }
          });
          
          if (emailError) {
            console.error('Email service error:', emailError);
            errors.push(`Batch error: ${emailError.message}`);
          } else {
            totalSent += batch.length;
            console.log(`Successfully sent emails to batch of ${batch.length} users`);
          }
        } catch (batchError: any) {
          console.error('Batch processing error:', batchError);
          errors.push(`Failed to process batch: ${batchError.message}`);
        }
      }
      
      // Log the email activity
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: 'system', // System-generated activity
          activity_type: 'bulk_email_sent',
          description: `Bulk email sent to ${totalSent} users`,
          metadata: {
            total_recipients: totalSent,
            failed_batches: errors.length,
            selected_user_count: selectedUsers.length,
            valid_email_count: validUsers.length,
            errors: errors
          }
        });
        
      if (logError) {
        console.warn('Failed to log email activity:', logError);
      }
      
      if (errors.length > 0 && totalSent === 0) {
        throw new Error(`Failed to send any emails: ${errors.join(', ')}`);
      }
      
      if (errors.length > 0) {
        toast.warning(`Emails sent to ${totalSent} users, but ${errors.length} batches failed`);
      }
      
      return {
        success: true,
        totalSent,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully sent emails to ${totalSent} out of ${selectedUsers.length} selected users`
      };
      
    } catch (error: any) {
      console.error('Bulk email error:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
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

  const changeBulkUserRoles = async () => {
    console.log(`Changing roles for users to ${bulkRole}:`, selectedUsers);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role: bulkRole,
        updated_at: new Date().toISOString()
      })
      .in('id', selectedUsers)
      .select();
      
    console.log("Role update result:", { data, error });
    
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
          <DropdownMenuItem onClick={() => handleAction("change-role")}>
            <UserCog className="mr-2 h-4 w-4 text-purple-500" />
            Change Role
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
          
          {showRoleSelector && (
            <div className="py-4">
              <RoleSelector role={bulkRole} onRoleChange={setBulkRole} />
            </div>
          )}
          
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
