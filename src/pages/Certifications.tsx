
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificateRequests } from "@/components/CertificateRequests";
import { BatchCertificateUpload } from "@/components/certificates/BatchCertificateUpload";
import { TemplateManager } from "@/components/certificates/TemplateManager";
import { useProfile } from "@/hooks/useProfile";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Download, FileCheck, Upload } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CertificatesTable } from "@/components/certificates/CertificatesTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";

export default function Certifications() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
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

  // Enhanced delete certificate mutation with proper error handling
  const deleteCertificateMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', certificateId);
      
      if (error) throw error;
      return certificateId;
    },
    onMutate: (certificateId) => {
      // Optimistic update - remove from cache
      queryClient.setQueryData(['certificates'], (oldData: any[]) => {
        return oldData.filter(cert => cert.id !== certificateId);
      });
    },
    onSuccess: (certificateId) => {
      toast.success('Certificate deleted successfully');
      // Invalidate the query to refetch data
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
    onError: (error) => {
      console.error('Error deleting certificate:', error);
      toast.error(`Failed to delete certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Refresh data to restore correct state
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });

  const handleDeleteCertificate = (certificateId: string) => {
    deleteCertificateMutation.mutate(certificateId);
  };

  // Enhanced bulk deletion with proper error handling
  const bulkDeleteCertificatesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .filter('id', 'not.is', null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('All certificates deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
    onError: (error) => {
      console.error('Error bulk deleting certificates:', error);
      toast.error(`Failed to delete certificates: ${error instanceof Error ? error.message : 'Unknown error'}`);
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });

  const handleBulkDeleteCertificates = () => {
    bulkDeleteCertificatesMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        <PageHeader
          icon={<Award className="h-7 w-7 text-primary" />}
          title="Certificate Management"
          subtitle={
            canManageRequests
              ? 'Review and manage certificate requests or create new certificates'
              : 'Request new certificates and view your requests'
          }
        />
        
        <div className="bg-white dark:bg-secondary/10 border rounded-xl shadow-sm p-6 w-full">
          <Tabs defaultValue="requests" className="w-full">
            <TabsList 
              className="grid w-full grid-cols-5 mb-6"
              gradient="bg-gradient-to-r from-primary to-purple-600"
            >
              <TabsTrigger value="requests" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2`}>
                <FileCheck className="h-4 w-4" />
                {canManageRequests ? 'Pending Approvals' : 'My Requests'}
              </TabsTrigger>
              <TabsTrigger value="certificates" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2`}>
                <Award className="h-4 w-4" />
                Certificates
              </TabsTrigger>
              <TabsTrigger value="new" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2`}>
                <FileCheck className="h-4 w-4" />
                {canManageRequests ? 'New Certificate' : 'New Request'}
              </TabsTrigger>
              <TabsTrigger value="batch" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2`}>
                <Upload className="h-4 w-4" />
                Batch Upload
              </TabsTrigger>
              {canManageRequests && (
                <TabsTrigger value="templates" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2`}>
                  <FileCheck className="h-4 w-4" />
                  Templates
                </TabsTrigger>
              )}
            </TabsList>

            <div className="mt-2 w-full">
              <TabsContent value="requests" className={`${isMobile ? 'mt-4' : 'mt-6'} w-full`}>
                <CertificateRequests />
              </TabsContent>
              
              <TabsContent value="certificates" className={`${isMobile ? 'mt-4' : 'mt-6'} w-full`}>
                <Card className="w-full">
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
                      onDeleteCertificate={handleDeleteCertificate}
                      onBulkDelete={handleBulkDeleteCertificates}
                      isDeleting={deleteCertificateMutation.isPending}
                      isBulkDeleting={bulkDeleteCertificatesMutation.isPending}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="new" className={`${isMobile ? 'mt-4' : 'mt-6'} w-full`}>
                <CertificateForm />
              </TabsContent>

              <TabsContent value="batch" className={`${isMobile ? 'mt-4' : 'mt-6'} w-full`}>
                <BatchCertificateUpload />
              </TabsContent>
              
              {canManageRequests && (
                <TabsContent value="templates" className={`${isMobile ? 'mt-4' : 'mt-6'} w-full`}>
                  <TemplateManager />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
