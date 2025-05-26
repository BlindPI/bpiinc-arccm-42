
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function ResetPasswordDialog({
  isResetPasswordDialogOpen,
  setIsResetPasswordDialogOpen,
  isProcessing,
  handleResetPasswordConfirm,
}: any) {
  return (
    <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Password</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reset the password for this user? An email will be sent to the user with instructions on how to reset their password.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsResetPasswordDialogOpen(false)} disabled={isProcessing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleResetPasswordConfirm} disabled={isProcessing}>
            {isProcessing ? 'Sending...' : 'Reset Password'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
