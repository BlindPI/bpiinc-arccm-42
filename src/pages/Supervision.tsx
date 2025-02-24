
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserSupervisionView } from "@/components/user-management/UserSupervisionView";

export default function Supervision() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4">My Team</h1>
        <UserSupervisionView />
      </div>
    </DashboardLayout>
  );
}
