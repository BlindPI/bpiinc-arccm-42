
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

export function UserManagementLoading() {
  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading user management...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
