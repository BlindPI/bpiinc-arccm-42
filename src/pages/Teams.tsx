
import { DashboardLayout } from "@/components/DashboardLayout";
import TeamHierarchy from "@/components/teams/TeamHierarchy";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Teams() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <DashboardLayout>
      <TeamHierarchy />
    </DashboardLayout>
  );
}
