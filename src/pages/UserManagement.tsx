
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users } from "lucide-react";
import { UserManagementLoading } from "@/components/user-management/UserManagementLoading";
import { UserManagementAccessDenied } from "@/components/user-management/UserManagementAccessDenied";
import UserManagementPage from "@/components/user-management/UserManagementPage";

export default function UserManagement() {
  const { data: profile, isLoading } = useProfile();
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader
          icon={<Users className="h-7 w-7 text-primary" />}
          title="User Management"
          subtitle="Manage users and their roles"
          className="mb-6"
        />
        <UserManagementLoading />
      </DashboardLayout>
    );
  }
  
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <PageHeader
          icon={<Users className="h-7 w-7 text-primary" />}
          title="User Management"
          subtitle="Manage users and their roles"
          className="mb-6"
        />
        <UserManagementAccessDenied />
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <PageHeader
        icon={<Users className="h-7 w-7 text-primary" />}
        title="User Management"
        subtitle="Manage users and their roles"
        badge={{
          text: "Admin Access",
          variant: "success"
        }}
        className="mb-6"
      />
      <UserManagementPage />
    </DashboardLayout>
  );
}
