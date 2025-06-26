import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateForm } from "@/components/CertificateForm";
import { BatchCertificateUpload } from "@/components/certificates/BatchCertificateUpload";
import { TemplateManager } from "@/components/certificates/TemplateManager";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, History, Archive, Plus, FileCheck, Upload, AlertTriangle, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/ui/PageHeader";
import { CertificateRequestsContainer } from "@/components/certificates/CertificateRequestsContainer";
import { EnhancedCertificatesView } from "@/components/certificates/enhanced-views/EnhancedCertificatesView";
import { EnhancedRostersView } from "@/components/certificates/enhanced-views/EnhancedRostersView";
import { EnhancedArchivedView } from "@/components/certificates/enhanced-views/EnhancedArchivedView";
import { CertificateRecoveryDashboard } from "@/components/certificates/CertificateRecoveryDashboard";
import { debugLog } from "@/utils/debugUtils";
import { useState } from "react";

export default function Certifications() {
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("batch");
  
  // Debug profile loading
  debugLog("Certifications: Profile data", {
    profile,
    isLoading: profileLoading,
    error: profileError,
    role: profile?.role
  });
  
  // Check if user can manage requests (SA, AD, or AP users)
  const canManageRequests = profile?.role && ['SA', 'AD', 'AP'].includes(profile.role);
  
  debugLog("Certifications: Access control", {
    role: profile?.role,
    canManageRequests
  });

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Certificate Management</h3>
            <p className="text-muted-foreground">
              Please wait while we load your certificate management interface...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if profile failed to load
  if (profileError || !profile) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Profile</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't load your profile information. This might be a temporary issue.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
