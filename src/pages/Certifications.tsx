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
import { Award, Download, FileCheck, Upload, Plus, History, Archive } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CertificatesTable } from "@/components/certificates/CertificatesTable";
import { ArchivedRequestsTable } from "@/components/certificates/ArchivedRequestsTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";

export default function Certifications() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isMobile = useIsMobile();

  // Updated query to fetch certificates based on user role
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', profile?.id, profile?.role],
    queryFn: async () => {
      console.log(`Fetching certificates for user ${profile?.id} with role ${profile?.role}`);

      // For non-admin users, we need to specifically look for certificates linked to them either by:
      // 1. user_id field (direct ownership)
      // 2. certificate_request_id that matches one of their requests
      if (!canManageRequests && profile?.id) {
        console.log(`Fetching certificates for non-admin user ${profile.id}`);
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching certificates:', error);
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} certificates for user ${profile.id}`);
        return data || [];
      } else {
        // For admins, fetch all certificates
        console.log('Fetching all certificates (admin view)');
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching certificates:', error);
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} certificates (admin view)`);
        return data || [];
      }
    },
    enabled: !!profile?.id, // Only run query when profile is loaded
  });
  
  // Improved query for archived certificate requests with proper debugging
  const { data: archivedRequests, isLoading: isLoadingArchived } = useQuery({
    queryKey: ['certificate_requests_archived', profile?.id, profile?.role],
    queryFn: async () => {
      console.log(`Fetching archived requests for ${canManageRequests ? 'admin' : 'user'} ${profile?.id}`);
      
      try {
        // Log the query we're about to make for debugging
        console.log('Archived requests query parameters:', {
          status: 'ARCHIVED',
          userId: !canManageRequests ? profile?.id : 'all'
        });
        
        let query = supabase
          .from('certificate_requests')
          .select('*')
          .eq('status', 'ARCHIVED')
          .order('updated_at', { ascending: false });
          
        // If not an admin, only show the user's own archived requests
        if (!canManageRequests && profile?.id) {
          query = query.eq('user_id', profile.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching archived requests:', error);
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} archived requests:`, data);
        
        // Let's also check for any requests that should be archived but aren't
        // This is just for debugging
        if (canManageRequests) {
          const { data: allRequests, error: allError } = await supabase
            .from('certificate_requests')
            .select('id, status')
            .or('status.eq.REJECTED,status.eq.APPROVED,status.eq.ARCHIVED');
            
          if (!allError) {
            console.log('Status distribution of all requests:', 
              allRequests?.reduce((acc, req) => {
                acc[req.status] = (acc[req.status] || 0) + 1;
                return acc;
              }, {})
            );
          }
        }
        
        return data;
      } catch (error) {
        console.error('Failed to fetch archived requests:', error);
        return [];
      }
    },
    enabled: !!profile?.id, // Only run query when profile is loaded
  });

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
      queryClient.setQueryData(['certificates'], (oldData: any[]) => {
        return oldData.filter(cert => cert.id !== certificateId);
      });
    },
    onSuccess: (certificateId) => {
      toast.success('Certificate deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      // Also invalidate archived requests in case any were affected
      queryClient.invalidateQueries({ queryKey: ['certificate_requests_archived'] });
    },
    onError: (error) => {
      console.error('Error deleting certificate:', error);
      toast.error(`Failed to delete certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });

  const handleDeleteCertificate = (certificateId: string) => {
    deleteCertificateMutation.mutate(certificateId);
  };

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
      // Also invalidate archived requests
      queryClient.invalidateQueries({ queryKey: ['certificate_requests_archived'] });
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
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <PageHeader
          icon={<Award className="h-7 w-7 text-primary" />}
          title="Certificate Management"
          subtitle={
            canManageRequests
              ? "Create, review, and manage certificates in one place"
              : "Request new certificates and track your certification status"
          }
          badge={{
            text: canManageRequests ? "Admin Access" : "Standard Access",
            variant: canManageRequests ? "success" : "info"
          }}
        />
        
        <div className="bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border rounded-xl shadow-sm p-6 w-full">
          <Tabs defaultValue="requests" className="w-full">
            <TabsList 
              className="grid w-full grid-cols-6 mb-6 bg-gradient-to-r from-primary/90 to-primary p-1 rounded-lg shadow-md"
            >
              <TabsTrigger 
                value="requests" 
                className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
              >
                <FileCheck className="h-4 w-4" />
                {canManageRequests ? 'Pending Approvals' : 'My Requests'}
              </TabsTrigger>
              <TabsTrigger 
                value="archived" 
                className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
              >
                <Archive className="h-4 w-4" />
                Archived
              </TabsTrigger>
              <TabsTrigger 
                value="certificates" 
                className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
              >
                <History className="h-4 w-4" />
                Certificates
              </TabsTrigger>
              <TabsTrigger 
                value="new" 
                className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
              >
                <Plus className="h-4 w-4" />
                {canManageRequests ? 'New Certificate' : 'New Request'}
              </TabsTrigger>
              <TabsTrigger 
                value="batch" 
                className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
              >
                <Upload className="h-4 w-4" />
                Batch Upload
              </TabsTrigger>
              {canManageRequests && (
                <TabsTrigger 
                  value="templates" 
                  className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
                >
                  <FileCheck className="h-4 w-4" />
                  Templates
                </TabsTrigger>
              )}
            </TabsList>

            <div className="mt-2 w-full">
              <TabsContent value="requests" className="mt-6 space-y-6">
                <CertificateRequests />
              </TabsContent>
              
              <TabsContent value="archived" className="mt-6">
                <ArchivedRequestsTable 
                  requests={archivedRequests || []} 
                  isLoading={isLoadingArchived} 
                />
              </TabsContent>
              
              <TabsContent value="certificates" className="mt-6">
                <Card className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50/80">
                  <CardHeader className="pb-4 border-b">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Award className="h-5 w-5 text-primary" />
                      {canManageRequests ? 'Certificate History' : 'Your Certificates'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
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
              
              <TabsContent value="new" className="mt-6">
                <CertificateForm />
              </TabsContent>

              <TabsContent value="batch" className="mt-6">
                <BatchCertificateUpload />
              </TabsContent>
              
              {canManageRequests && (
                <TabsContent value="templates" className="mt-6">
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
