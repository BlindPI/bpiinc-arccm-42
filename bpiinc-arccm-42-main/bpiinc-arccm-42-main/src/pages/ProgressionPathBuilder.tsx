
import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProgressionPathBuilder } from "@/components/role-management/progression/ProgressionPathBuilder";

const ProgressionPathBuilderPage = () => {
  return (
    <DashboardLayout>
      <main className="min-h-screen bg-background py-4">
        <ProgressionPathBuilder />
      </main>
    </DashboardLayout>
  );
};

export default ProgressionPathBuilderPage;
