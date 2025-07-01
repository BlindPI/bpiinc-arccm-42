
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
import { AlertTriangle } from "lucide-react";

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
    <AlertDialogContent className="bg-white border border-gray-100 shadow-lg max-w-md rounded-lg p-6">
      <AlertDialogHeader>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-red-50 p-2.5 rounded-full border border-red-100">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900">
            {isBulkDelete ? 'Delete All Certificates' : 'Delete Certificate'}
          </AlertDialogTitle>
        </div>
        <AlertDialogDescription className="text-gray-600">
          {isBulkDelete 
            ? 'Are you sure you want to delete all certificates? This action cannot be undone.'
            : 'Are you sure you want to delete this certificate? Only System Administrators can perform this action.'}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-3 mt-6">
        <AlertDialogCancel className="bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200 transition-colors shadow-sm">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirmDelete}
          className="bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
