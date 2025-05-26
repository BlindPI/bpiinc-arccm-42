
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserSupervisionView } from "@/components/user-management/UserSupervisionView";

export default function Supervision() {
  return (
    <DashboardLayout>
      <UserSupervisionView />
    </DashboardLayout>
  );
}
