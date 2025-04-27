
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteCertificateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
  isBulkDelete?: boolean;
}

export function DeleteCertificateDialog({
  isOpen,
  onOpenChange,
  onConfirmDelete,
  isDeleting,
  isBulkDelete = false
}: DeleteCertificateDialogProps) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {isBulkDelete ? 'Delete All Certificates' : 'Delete Certificate'}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {isBulkDelete 
            ? 'Are you sure you want to delete all certificates? This action cannot be undone.'
            : 'Are you sure you want to delete this certificate? Only System Administrators can perform this action.'}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirmDelete}
          className="bg-red-600 hover:bg-red-700"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
