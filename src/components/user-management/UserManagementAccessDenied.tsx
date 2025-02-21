
import { AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function UserManagementAccessDenied() {
  return (
    <DashboardLayout>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to access the User Management section.
        </AlertDescription>
      </Alert>
    </DashboardLayout>
  );
}
