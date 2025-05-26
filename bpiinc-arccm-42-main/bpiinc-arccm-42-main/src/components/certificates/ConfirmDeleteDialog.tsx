
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DeleteCertificateDialog } from "./DeleteCertificateDialog";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title?: string;
  description?: string;
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  title,
  description
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogTrigger className="hidden" />
      <DeleteCertificateDialog
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
        onConfirmDelete={onConfirm}
        isDeleting={isDeleting}
        isBulkDelete={!!title && title.includes("All")}
      />
    </AlertDialog>
  );
}
