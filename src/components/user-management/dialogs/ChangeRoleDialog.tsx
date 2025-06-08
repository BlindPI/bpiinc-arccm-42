
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ChangeRoleDialog({
  isChangeRoleDialogOpen,
  setIsChangeRoleDialogOpen,
  handleRoleChange,
  handleChangeRoleConfirm,
  isProcessing,
  newRole,
}: any) {
  // Ensure newRole is never an empty string
  const safeNewRole = newRole || undefined;
  
  return (
    <AlertDialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change User Role</AlertDialogTitle>
          <AlertDialogDescription>
            Select a new role for this user.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-role" className="text-right">
              New Role
            </Label>
            <Select onValueChange={handleRoleChange} value={safeNewRole}>
              <SelectTrigger id="new-role" className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IT">Instructor Trainee</SelectItem>
                <SelectItem value="IP">Instructor Provisional</SelectItem>
                <SelectItem value="IC">Instructor Certified</SelectItem>
                <SelectItem value="AP">Authorized Provider</SelectItem>
                <SelectItem value="AD">Administrator</SelectItem>
                <SelectItem value="SA">System Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsChangeRoleDialogOpen(false)} disabled={isProcessing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleChangeRoleConfirm} disabled={isProcessing}>
            {isProcessing ? 'Updating...' : 'Change Role'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
