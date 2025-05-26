
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificateRequests } from "@/components/CertificateRequests";
import { BatchCertificateUpload } from "@/components/certificates/BatchCertificateUpload";
import { TemplateManager } from "@/components/certificates/TemplateManager";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, History, Archive, Plus, FileCheck, Upload, AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArchivedRequestsTable } from "@/components/certificates/ArchivedRequestsTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedCertificatesTable } from "@/components/certificates/EnhancedCertificatesTable";
import { useCertificateFiltering } from "@/hooks/useCertificateFiltering";
import { RosterView } from "@/components/certificates/RosterView";
import { CertificateRecoveryDashboard } from "@/components/certificates/CertificateRecoveryDashboard";

export default function Certifications() {
  const { data: profile } = useProfile();
  const isMobile = useIsMobile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  // Use the custom filtering hook
  const {
    certificates,
    isLoading,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    resetFilters,
    batches,
    refetch
  } = useCertificateFiltering();
  
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
        return data;
      } catch (error) {
        console.error('Failed to fetch archived requests:', error);
        return [];
      }
    },
    enabled: !!profile?.id, // Only run query when profile is loaded
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        icon={<Award className="h-7 w-7 text-primary" />}
        title="Certificate Management"
        subtitle={
          canManageRequests
            ? "Create, review, and manage certificates in one place"
            : "Request and track your certification status"
        }
        badge={{
          text: canManageRequests ? "Admin Access" : "Standard Access",
          variant: canManageRequests ? "success" : "info"
        }}
      />
      
      <div className="bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border rounded-xl shadow-sm p-6 w-full">
        <Tabs defaultValue="batch" className="w-full">
          <TabsList 
            className="flex flex-nowrap w-full mb-6 bg-gradient-to-r from-primary/90 to-primary p-1 rounded-lg shadow-md overflow-x-auto"
          >
            <TabsTrigger 
              value="batch" 
              className={`flex-1 min-w-0 ${isMobile ? 'text-xs py-2' : ''} flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
            >
              <Upload className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Batch Upload</span>
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className={`flex-1 min-w-0 ${isMobile ? 'text-xs py-2' : ''} flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
            >
              <FileCheck className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{canManageRequests ? 'Pending Approvals' : 'My Requests'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="certificates" 
              className={`flex-1 min-w-0 ${isMobile ? 'text-xs py-2' : ''} flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
            >
              <History className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Certificates</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rosters" 
              className={`flex-1 min-w-0 ${isMobile ? 'text-xs py-2' : ''} flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
            >
              <Award className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Rosters</span>
            </TabsTrigger>
            <TabsTrigger 
              value="archived" 
              className={`flex-1 min-w-0 ${isMobile ? 'text-xs py-2' : ''} flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
            >
              <Archive className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Archived</span>
            </TabsTrigger>
            {canManageRequests && (
              <>
                <TabsTrigger 
                  value="recovery" 
                  className={`flex-1 min-w-0 ${isMobile ? 'text-xs py-2' : ''} flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
                >
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Recovery</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="new" 
                  className={`flex-1 min-w-0 ${isMobile ? 'text-xs py-2' : ''} flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
                >
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">New Certificate</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="templates" 
                  className={`flex-1 min-w-0 ${isMobile ? 'text-xs py-2' : ''} flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm`}
                >
                  <FileCheck className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Templates</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <div className="mt-2 w-full">
            <TabsContent value="batch" className="mt-6">
              <BatchCertificateUpload />
            </TabsContent>
          
            <TabsContent value="requests" className="mt-6 space-y-6">
              <CertificateRequests />
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
                  <EnhancedCertificatesTable 
                    certificates={certificates || []} 
                    isLoading={isLoading}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={resetFilters}
                    batches={batches}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rosters" className="mt-6">
              <Card className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50/80">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Award className="h-5 w-5 text-primary" />
                    {canManageRequests ? 'Certificate Rosters' : 'Your Certificate Rosters'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <RosterView 
                    certificates={certificates || []} 
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="archived" className="mt-6">
              <ArchivedRequestsTable 
                requests={archivedRequests || []} 
                isLoading={isLoadingArchived} 
              />
            </TabsContent>
            
            {canManageRequests && (
              <>
                <TabsContent value="recovery" className="mt-6">
                  <CertificateRecoveryDashboard />
                </TabsContent>
                
                <TabsContent value="new" className="mt-6">
                  <CertificateForm />
                </TabsContent>
                
                <TabsContent value="templates" className="mt-6">
                  <TemplateManager />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
