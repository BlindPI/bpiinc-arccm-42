
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditUserDialog({
  isEditDialogOpen,
  setIsEditDialogOpen,
  editFormData,
  handleEditFormChange,
  handleEditSubmit,
  isProcessing,
}: any) {
  return (
    <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit User</AlertDialogTitle>
          <AlertDialogDescription>
            Make changes to the user profile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              type="text"
              id="display_name"
              name="display_name"
              value={(editFormData.display_name || '') as string}
              onChange={handleEditFormChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={(editFormData.email || '') as string}
              onChange={handleEditFormChange}
              className="col-span-3"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsEditDialogOpen(false)} disabled={isProcessing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleEditSubmit} disabled={isProcessing}>
            {isProcessing ? 'Updating...' : 'Update'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
