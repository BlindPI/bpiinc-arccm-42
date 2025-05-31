
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Award, 
  Upload, 
  FileCheck, 
  History, 
  Archive, 
  Plus, 
  AlertTriangle,
  Menu,
  X
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/ui/PageHeader";
import { EnhancedPendingRequestsView } from "@/components/certificates/enhanced-requests/EnhancedPendingRequestsView";
import { EnhancedRostersView } from "@/components/certificates/enhanced-views/EnhancedRostersView";
import { MobileTabNavigation } from "@/components/certificates/mobile/MobileTabNavigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function EnhancedCertifications() {
  const { data: profile } = useProfile();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("batch");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  const tabs = [
    {
      id: "batch",
      label: isMobile ? "Upload" : "Batch Upload",
      icon: Upload,
      description: "Upload multiple certificates at once"
    },
    {
      id: "requests",
      label: isMobile ? "Requests" : "Pending Approvals",
      icon: FileCheck,
      description: canManageRequests ? "Review and approve requests" : "Your requests"
    },
    {
      id: "certificates",
      label: isMobile ? "Certs" : "Certificates",
      icon: History,
      description: "View certificate history"
    },
    {
      id: "rosters",
      label: "Rosters",
      icon: Award,
      description: "Certificate rosters and analytics"
    },
    {
      id: "archived",
      label: "Archived",
      icon: Archive,
      description: "Archived requests"
    },
    ...(canManageRequests ? [
      {
        id: "recovery",
        label: "Recovery",
        icon: AlertTriangle,
        description: "Failed certificate recovery"
      },
      {
        id: "new",
        label: isMobile ? "New" : "New Certificate",
        icon: Plus,
        description: "Create single certificate"
      }
    ] : [])
  ];

  const TabContent = ({ tabId, children }: { tabId: string; children: React.ReactNode }) => (
    <TabsContent value={tabId} className="mt-0 space-y-6">
      <div className="min-h-[60vh]">
        {children}
      </div>
    </TabsContent>
  );

  const TabNavigation = () => (
    <div className="space-y-4">
      {isMobile ? (
        <MobileTabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      ) : (
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-7 gap-1 h-auto p-1 bg-gradient-to-r from-primary/10 to-primary/5">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex flex-col items-center gap-1 p-3 h-auto text-xs data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline truncate">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in px-4 sm:px-6">
      {/* Mobile-First Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          icon={<Award className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />}
          title={isMobile ? "Certificates" : "Certificate Management"}
          subtitle={
            canManageRequests
              ? "Create, review, and manage certificates"
              : "Request and track certifications"
          }
          badge={{
            text: canManageRequests ? "Admin" : "User",
            variant: canManageRequests ? "success" : "info"
          }}
        />
        
        {/* Mobile Menu Trigger */}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Certificate Actions</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <tab.icon className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-muted-foreground">{tab.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardContent className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabNavigation />

            <div className="mt-6">
              <TabContent tabId="batch">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Enhanced Batch Upload
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      Please use the "Batch Upload" tab in the main Certifications page for the current workflow.
                    </div>
                  </CardContent>
                </Card>
              </TabContent>

              <TabContent tabId="requests">
                <EnhancedPendingRequestsView />
              </TabContent>

              <TabContent tabId="certificates">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Certificate History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      Enhanced certificate history view coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabContent>

              <TabContent tabId="rosters">
                <EnhancedRostersView />
              </TabContent>

              <TabContent tabId="archived">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5" />
                      Archived Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      Enhanced archived view coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabContent>

              {canManageRequests && (
                <>
                  <TabContent tabId="recovery">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Certificate Recovery
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                          Enhanced recovery tools coming soon...
                        </div>
                      </CardContent>
                    </Card>
                  </TabContent>

                  <TabContent tabId="new">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-5 w-5" />
                          Create New Certificate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                          Enhanced single certificate creation coming soon...
                        </div>
                      </CardContent>
                    </Card>
                  </TabContent>
                </>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
