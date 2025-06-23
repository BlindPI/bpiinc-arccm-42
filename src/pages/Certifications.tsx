
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateForm } from "@/components/CertificateForm";
import { BatchCertificateUpload } from "@/components/certificates/BatchCertificateUpload";
import { TemplateManager } from "@/components/certificates/TemplateManager";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, History, Archive, Plus, FileCheck, Upload, AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/ui/PageHeader";
import { CertificateRequestsContainer } from "@/components/certificates/CertificateRequestsContainer";
import { EnhancedCertificatesView } from "@/components/certificates/enhanced-views/EnhancedCertificatesView";
import { EnhancedRostersView } from "@/components/certificates/enhanced-views/EnhancedRostersView";
import { EnhancedArchivedView } from "@/components/certificates/enhanced-views/EnhancedArchivedView";
import { CertificateRecoveryDashboard } from "@/components/certificates/CertificateRecoveryDashboard";

export default function Certifications() {
  const { data: profile } = useProfile();
  const isMobile = useIsMobile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        icon={<Award className="h-7 w-7 text-primary" />}
        title="Certificate Management"
        subtitle={
          canManageRequests
            ? "Create, review, and manage certificates with advanced analytics and bulk operations"
            : "Request and track your certification status with detailed insights"
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
              <CertificateRequestsContainer />
            </TabsContent>
            
            <TabsContent value="certificates" className="mt-6">
              <EnhancedCertificatesView />
            </TabsContent>
            
            <TabsContent value="rosters" className="mt-6">
              <EnhancedRostersView />
            </TabsContent>
            
            <TabsContent value="archived" className="mt-6">
              <EnhancedArchivedView />
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
