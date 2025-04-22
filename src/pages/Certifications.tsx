import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificateRequests } from "@/components/CertificateRequests";
import { BatchCertificateUpload } from "@/components/certificates/BatchCertificateUpload";
import { TemplateManager } from "@/components/certificates/TemplateManager";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Download, FileCheck, Upload } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CertificatesTable } from "@/components/certificates/CertificatesTable";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Certifications() {
  const { data: profile } = useProfile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isMobile = useIsMobile();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          icon={<Award className="h-7 w-7 text-primary" />}
          title="Certificate Management"
          subtitle={
            canManageRequests
              ? 'Review and manage certificate requests or create new certificates'
              : 'Request new certificates and view your requests'
          }
        />
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className={`grid w-full max-w-[900px] grid-cols-5 ${isMobile ? 'gap-1 p-1' : ''}`}>
            <TabsTrigger value="requests" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
              <FileCheck className="h-4 w-4" />
              {canManageRequests ? 'Pending Approvals' : 'My Requests'}
            </TabsTrigger>
            <TabsTrigger value="certificates" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
              <Award className="h-4 w-4" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="new" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
              <FileCheck className="h-4 w-4" />
              {canManageRequests ? 'New Certificate' : 'New Request'}
            </TabsTrigger>
            <TabsTrigger value="batch" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
              <Upload className="h-4 w-4" />
              Batch Upload
            </TabsTrigger>
            {canManageRequests && (
              <TabsTrigger value="templates" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
                <FileCheck className="h-4 w-4" />
                Templates
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="requests" className={isMobile ? 'mt-4' : 'mt-6'}>
            <CertificateRequests />
          </TabsContent>
          
          <TabsContent value="certificates" className={isMobile ? 'mt-4' : 'mt-6'}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certificate History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CertificatesTable 
                  certificates={certificates || []} 
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="new" className={isMobile ? 'mt-4' : 'mt-6'}>
            <div className="max-w-2xl mx-auto">
              <CertificateForm />
            </div>
          </TabsContent>

          <TabsContent value="batch" className={isMobile ? 'mt-4' : 'mt-6'}>
            <div className="max-w-2xl mx-auto">
              <BatchCertificateUpload />
            </div>
          </TabsContent>
          
          {canManageRequests && (
            <TabsContent value="templates" className={isMobile ? 'mt-4' : 'mt-6'}>
              <div className="max-w-3xl mx-auto">
                <TemplateManager />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
