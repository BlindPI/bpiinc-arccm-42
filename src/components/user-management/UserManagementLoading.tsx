
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

export function UserManagementLoading() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    </DashboardLayout>
  );
}
