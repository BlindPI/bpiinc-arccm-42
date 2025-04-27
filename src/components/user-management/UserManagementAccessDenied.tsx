
import { AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export function UserManagementAccessDenied() {
  return (
    <DashboardLayout>
      <Card className="max-w-2xl mx-auto mt-8 p-6 border border-border/50 shadow-md">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the User Management section.
          </AlertDescription>
        </Alert>
      </Card>
    </DashboardLayout>
  );
}
