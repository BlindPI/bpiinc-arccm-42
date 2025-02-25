
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificateRequests } from "@/components/CertificateRequests";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Certifications() {
  const { data: profile } = useProfile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isMobile = useIsMobile();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Certificate Management
          </h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
            {canManageRequests 
              ? 'Review and manage certificate requests or create new certificates'
              : 'Request new certificates and view your requests'}
          </p>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className={`grid w-full max-w-[400px] grid-cols-2 ${isMobile ? 'gap-1 p-1' : ''}`}>
            <TabsTrigger value="requests" className={isMobile ? 'text-sm px-2' : ''}>
              {canManageRequests ? 'Pending Approvals' : 'My Requests'}
            </TabsTrigger>
            <TabsTrigger value="new" className={isMobile ? 'text-sm px-2' : ''}>
              {canManageRequests ? 'New Certificate' : 'New Request'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests" className={isMobile ? 'mt-4' : 'mt-6'}>
            <CertificateRequests />
          </TabsContent>
          
          <TabsContent value="new" className={isMobile ? 'mt-4' : 'mt-6'}>
            <div className="max-w-2xl mx-auto">
              <CertificateForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
