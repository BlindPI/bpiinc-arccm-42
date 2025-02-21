
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificateRequests } from "@/components/CertificateRequests";
import { useProfile } from "@/hooks/useProfile";

export default function Certifications() {
  const { data: profile } = useProfile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground">
            {canManageRequests 
              ? 'Review and manage certificate requests or create new certificates'
              : 'Request new certificates and view your requests'}
          </p>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            {canManageRequests ? (
              <>
                <TabsTrigger value="requests">Pending Approvals</TabsTrigger>
                <TabsTrigger value="new">New Certificate</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="requests">My Requests</TabsTrigger>
                <TabsTrigger value="new">New Request</TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="requests" className="mt-6">
            <CertificateRequests />
          </TabsContent>
          
          <TabsContent value="new" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <CertificateForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
