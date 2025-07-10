
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateForm } from "@/components/CertificateForm";
import { BatchCertificateUpload } from "@/components/certificates/BatchCertificateUpload";
import { TemplateManager } from "@/components/certificates/TemplateManager";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, History, Archive, Plus, FileCheck, Upload, AlertTriangle, Grid, List } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CertificateRequestsContainer } from "@/components/certificates/CertificateRequestsContainer";
import { EnhancedCertificatesView } from "@/components/certificates/enhanced-views/EnhancedCertificatesView";
import { EnhancedRostersView } from "@/components/certificates/enhanced-views/EnhancedRostersView";
import { EnhancedArchivedView } from "@/components/certificates/enhanced-views/EnhancedArchivedView";
import { CertificateRecoveryDashboard } from "@/components/certificates/CertificateRecoveryDashboard";
import { CertificateMetricsHeader } from "@/components/certificates/dashboard/CertificateMetricsHeader";
import { CertificateNavigationCards } from "@/components/certificates/navigation/CertificateNavigationCards";
import { MobileTabNavigation } from "@/components/certificates/mobile/MobileTabNavigation";

export default function Certifications() {
  const { data: profile } = useProfile();
  const isMobile = useIsMobile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  const [activeTab, setActiveTab] = useState("batch");
  const [viewMode, setViewMode] = useState<'cards' | 'tabs'>(isMobile ? 'tabs' : 'cards');

  const navigateToTab = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  // Define tab structure for mobile navigation
  const tabData = [
    {
      id: 'batch',
      label: 'Batch Upload',
      icon: Upload,
      description: 'Upload multiple certificates efficiently'
    },
    {
      id: 'requests',
      label: canManageRequests ? 'Pending Approvals' : 'My Requests',
      icon: FileCheck,
      description: canManageRequests ? 'Review certificate requests' : 'Track request status'
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: History,
      description: 'View and manage issued certificates'
    },
    {
      id: 'rosters',
      label: 'Rosters',
      icon: Award,
      description: 'Certificate rosters and analytics'
    },
    {
      id: 'archived',
      label: 'Archived',
      icon: Archive,
      description: 'Archived requests and data'
    },
    ...(canManageRequests ? [
      {
        id: 'recovery',
        label: 'Recovery',
        icon: AlertTriangle,
        description: 'Failed certificate recovery'
      },
      {
        id: 'new',
        label: 'New Certificate',
        icon: Plus,
        description: 'Create individual certificates'
      },
      {
        id: 'templates',
        label: 'Templates',
        icon: FileCheck,
        description: 'Manage certificate templates'
      }
    ] : [])
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Enterprise Metrics Header */}
      <CertificateMetricsHeader canManageRequests={canManageRequests} />
      
      {/* Navigation Toggle - Desktop Only */}
      {!isMobile && (
        <div className="flex justify-end gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="flex items-center gap-2"
          >
            <Grid className="h-4 w-4" />
            Cards View
          </Button>
          <Button
            variant={viewMode === 'tabs' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tabs')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Tabs View
          </Button>
        </div>
      )}

      <div className="bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border rounded-xl shadow-sm p-6 w-full">
        {/* Conditional Navigation Rendering */}
        {viewMode === 'cards' ? (
          <div className="space-y-6">
            <CertificateNavigationCards
              activeTab={activeTab}
              onTabChange={setActiveTab}
              canManageRequests={canManageRequests}
            />
            
            {/* Content for selected card */}
            <div className="mt-8">
              {renderTabContent()}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile Tab Navigation */}
            {isMobile ? (
              <div className="mb-6">
                <MobileTabNavigation
                  tabs={tabData}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </div>
            ) : (
              <TabsList
                className="flex flex-nowrap w-full mb-6 bg-gradient-to-r from-primary/90 to-primary p-1 rounded-lg shadow-md overflow-x-auto"
              >
                <TabsTrigger
                  value="batch"
                  className="flex-1 min-w-0 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Upload className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Batch Upload</span>
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="flex-1 min-w-0 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <FileCheck className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{canManageRequests ? 'Pending Approvals' : 'My Requests'}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="certificates"
                  className="flex-1 min-w-0 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <History className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Certificates</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rosters"
                  className="flex-1 min-w-0 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Award className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Rosters</span>
                </TabsTrigger>
                <TabsTrigger
                  value="archived"
                  className="flex-1 min-w-0 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Archive className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Archived</span>
                </TabsTrigger>
                {canManageRequests && (
                  <>
                    <TabsTrigger
                      value="recovery"
                      className="flex-1 min-w-0 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Recovery</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="new"
                      className="flex-1 min-w-0 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      <Plus className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">New Certificate</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="templates"
                      className="flex-1 min-w-0 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      <FileCheck className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Templates</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            )}

            <div className="mt-2 w-full">
              {renderTabContent()}
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );

  function renderTabContent() {
    return (
      <>
        {viewMode === 'tabs' ? (
          <>
            <TabsContent value="batch" className="mt-6">
              <BatchCertificateUpload onNavigateToTab={navigateToTab} />
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
          </>
        ) : (
          // Cards view content rendering
          <div className="mt-6">
            {activeTab === 'batch' && <BatchCertificateUpload onNavigateToTab={navigateToTab} />}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <CertificateRequestsContainer />
              </div>
            )}
            {activeTab === 'certificates' && <EnhancedCertificatesView />}
            {activeTab === 'rosters' && <EnhancedRostersView />}
            {activeTab === 'archived' && <EnhancedArchivedView />}
            {canManageRequests && activeTab === 'recovery' && <CertificateRecoveryDashboard />}
            {canManageRequests && activeTab === 'new' && <CertificateForm />}
            {canManageRequests && activeTab === 'templates' && <TemplateManager />}
          </div>
        )}
      </>
    );
  }
}
