
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
    <AlertDialogContent className="bg-white border border-gray-200 shadow-lg max-w-md">
      <AlertDialogHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-600" />
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
      <AlertDialogFooter className="gap-2 mt-4">
        <AlertDialogCancel className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300 transition-colors">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirmDelete}
          className="bg-red-600 hover:bg-red-700 text-white transition-colors"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
