
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users } from "lucide-react";
import { UserManagementLoading } from "@/components/user-management/UserManagementLoading";
import { UserManagementAccessDenied } from "@/components/user-management/UserManagementAccessDenied";
import UserManagementPage from "@/pages/UserManagementPage";
import { useAuth } from "@/contexts/AuthContext";
import { SavedFiltersMenu } from '@/components/user-management/SavedFiltersMenu';

export default function UserManagement() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  if (authLoading || profileLoading) {
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
  
  if (!user)
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Please sign in</h1>
          <p className="text-muted-foreground">
            You need to be signed in to access this page.
          </p>
        </div>
      </DashboardLayout>
    );
  
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
        actions={
          <SavedFiltersMenu
            filters={{
              search: "",
              role: "all",
              compliance: "all"
            }}
            savedFilters={[]}
            onSave={() => {}}
            onApply={() => {}}
            onDelete={() => {}}
          />
        }
        className="mb-6"
      />
      <UserManagementPage />
    </DashboardLayout>
  );
}
