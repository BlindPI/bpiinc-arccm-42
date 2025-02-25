
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserSupervisionView } from "@/components/user-management/UserSupervisionView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupervisionSessionsView } from "@/components/user-management/SupervisionSessionsView";
import { Users2, History } from "lucide-react";

export default function Supervision() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Supervision Management</h1>
        
        <Tabs defaultValue="relationships" className="space-y-6">
          <TabsList>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="relationships">
            <UserSupervisionView />
          </TabsContent>

          <TabsContent value="sessions">
            <SupervisionSessionsView />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
