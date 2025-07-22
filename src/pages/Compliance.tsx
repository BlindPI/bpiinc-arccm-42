import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Toaster } from '../components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Upload, Users, FileText, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { TierRequirementsMatrix } from '../components/compliance/views/TierRequirementsMatrix';
import { ComplianceService, UserComplianceRecord } from '../services/compliance/complianceService';
import { ComplianceTierService, ComplianceTierInfo } from '../services/compliance/complianceTierService';
import { TierSwitchRequestService } from '../services/compliance/tierSwitchRequestService';
import { TeamMemberComplianceService, TeamMemberComplianceStatus } from '../services/compliance/teamMemberComplianceService';
import { useToast } from '../components/ui/use-toast';

const Compliance: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('requirements');
  const [complianceRecords, setComplianceRecords] = useState<UserComplianceRecord[]>([]);
  const [tierInfo, setTierInfo] = useState<ComplianceTierInfo | null>(null);
  const [teamMemberCompliance, setTeamMemberCompliance] = useState<TeamMemberComplianceStatus[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // For SA/AD users (System Admin/Admin), provide full oversight and visibility
  // SA and AD roles should have access to all compliance templates and oversight
  const getUserRoleForCompliance = () => {
    if (user?.role === 'SA' || user?.role === 'AD') {
      // SA/AD users get full visibility - treat as AP (Authorized Personnel) for matrix access
      // but with additional administrative privileges
      return 'AP';
    }
    return user?.role as 'AP' | 'IC' | 'IP' | 'IT';
  };

  const isAdminRole = user?.role === 'SA' || user?.role === 'AD';
  const isProviderRole = user?.role === 'AP';

  // Load user compliance data
  const loadComplianceData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Load base compliance data
      const [records, tier] = await Promise.all([
        ComplianceService.getUserComplianceRecords(user.id),
        ComplianceTierService.getUserComplianceTierInfo(user.id)
      ]);
      
      setComplianceRecords(records);
      setTierInfo(tier);

      // If admin, load additional data
      if (isAdminRole) {
        const requests = await TierSwitchRequestService.getPendingTierSwitchRequests();
        setPendingRequests(requests);
      }

      // If provider, load team member compliance
      if (isProviderRole && user.provider_id) {
        const teamCompliance = await TeamMemberComplianceService.getProviderTeamMemberCompliance(user.provider_id);
        setTeamMemberCompliance(teamCompliance);
      }
      
      console.log(`DEBUG: Loaded compliance data for user ${user.id}`);
      
    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: "Error Loading Compliance Data",
        description: "Failed to load your compliance information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.provider_id, toast, isAdminRole, isProviderRole]);

  // Load data on mount
  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  // Handle document upload - simplified interface for TierRequirementsMatrix
  const handleDocumentUpload = useCallback((
    requirementName: string,
    tier: 'basic' | 'robust'
  ) => {
    console.log(`DEBUG: Document upload requested for ${requirementName} on ${tier} tier`);
    
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file || !user?.id) return;
      
      try {
        setUploading(true);
        
        // Find matching compliance record
        const matchingRecord = complianceRecords.find(record =>
          record.compliance_metrics?.name?.toLowerCase().includes(requirementName.toLowerCase())
        );
        
        if (!matchingRecord) {
          toast({
            title: "Record Not Found",
            description: "Could not find matching compliance record for upload.",
            variant: "destructive",
          });
          return;
        }
        
        console.log(`DEBUG: Uploading ${file.name} for compliance record ${matchingRecord.id}`);
        
        // Upload document using compliance service
        await ComplianceService.uploadComplianceDocument(
          user.id,
          matchingRecord.id,
          file,
          'general'
        );
        
        toast({
          title: "Document Uploaded",
          description: `Successfully uploaded ${file.name}`,
          variant: "default",
        });
        
        // Reload compliance data to reflect changes
        await loadComplianceData();
        
      } catch (error) {
        console.error('Error uploading document:', error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    };
    
    fileInput.click();
  }, [user?.id, toast, loadComplianceData, complianceRecords]);

  // Handle tier switch request - simplified interface
  const handleTierSwitch = useCallback(async (newTier: 'basic' | 'robust') => {
    if (!user?.id || !tierInfo) return;
    
    try {
      console.log(`DEBUG: Requesting tier switch from ${tierInfo.tier} to ${newTier}`);
      
      // Check if user already has a pending request
      const hasPending = await TierSwitchRequestService.hasPendingRequest(user.id);
      
      if (hasPending) {
        toast({
          title: "Request Already Pending",
          description: "You already have a pending tier switch request.",
          variant: "default",
        });
        return;
      }
      
      // Create tier switch request with default justification
      const justification = `User requested switch from ${tierInfo.tier} to ${newTier} tier via compliance dashboard.`;
      
      await TierSwitchRequestService.createTierSwitchRequest({
        user_id: user.id,
        current_tier: tierInfo.tier,
        requested_tier: newTier,
        justification: justification
      });
      
      toast({
        title: "Tier Switch Requested",
        description: `Your request to switch to ${newTier} tier has been submitted for review.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error requesting tier switch:', error);
      toast({
        title: "Request Failed",
        description: "Failed to submit tier switch request. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.id, tierInfo, toast]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-500">Please log in to view compliance.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-500">Loading compliance data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.full_name || user.email}</p>
          {isAdminRole && (
            <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md inline-block">
              Administrator View - Full System Oversight
            </div>
          )}
          
          {/* Tier Info */}
          {tierInfo && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md">
                Current Tier: {tierInfo.tier.charAt(0).toUpperCase() + tierInfo.tier.slice(1)}
              </div>
              <div className="text-gray-600">
                Progress: {tierInfo.completed_requirements}/{tierInfo.total_requirements} 
                ({tierInfo.completion_percentage}%)
              </div>
              {uploading && (
                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                  Uploading document...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Requirements
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Documents
            </TabsTrigger>
            {(isProviderRole || isAdminRole) && (
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Compliance
              </TabsTrigger>
            )}
            {isAdminRole && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Admin Panel
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Requirements Matrix Tab */}
          <TabsContent value="requirements" className="mt-6">
            <TierRequirementsMatrix
              userRole={getUserRoleForCompliance()}
              currentTier={tierInfo?.tier || 'basic'}
              userComplianceRecords={complianceRecords}
              onUploadDocument={handleDocumentUpload}
              onTierSwitch={handleTierSwitch}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Upload and manage your compliance documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {complianceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{record.compliance_metrics?.name || 'Unknown Requirement'}</h3>
                        <p className="text-sm text-gray-600">{record.compliance_metrics?.category}</p>
                        <Badge variant={record.compliance_status === 'compliant' ? 'default' : 'destructive'}>
                          {record.compliance_status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.compliance_status === 'compliant' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        )}
                        <Button variant="outline" size="sm">
                          Upload Document
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Compliance Tab */}
          {(isProviderRole || isAdminRole) && (
            <TabsContent value="team" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Compliance Overview</CardTitle>
                  <CardDescription>
                    Monitor compliance status of your team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {teamMemberCompliance.map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{member.member_name}</h3>
                          <p className="text-sm text-gray-600">{member.member_email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={member.compliance_status === 'compliant' ? 'default' : 'destructive'}>
                              {member.compliance_status}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              Score: {member.compliance_score}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Pending: {member.pending_actions} | Overdue: {member.overdue_actions}
                          </div>
                          <div className="text-sm text-gray-600">
                            Team: {member.team_name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Admin Panel Tab */}
          {isAdminRole && (
            <TabsContent value="admin" className="mt-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Tier Switch Requests</CardTitle>
                    <CardDescription>
                      Review and approve tier change requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingRequests.length === 0 ? (
                      <p className="text-gray-600">No pending requests</p>
                    ) : (
                      <div className="grid gap-4">
                        {pendingRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{request.user_profile?.display_name}</h3>
                              <p className="text-sm text-gray-600">{request.user_profile?.email}</p>
                              <p className="text-sm">
                                Requesting: {request.current_tier} → {request.requested_tier}
                              </p>
                              <p className="text-sm text-gray-600">{request.justification}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="default" size="sm">Approve</Button>
                              <Button variant="destructive" size="sm">Reject</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                    <CardDescription>
                      Global compliance statistics and system health
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">85%</div>
                        <div className="text-sm text-gray-600">Overall Compliance</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{complianceRecords.length}</div>
                        <div className="text-sm text-gray-600">Total Records</div>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">{pendingRequests.length}</div>
                        <div className="text-sm text-gray-600">Pending Requests</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{teamMemberCompliance.length}</div>
                        <div className="text-sm text-gray-600">Active Users</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Settings</CardTitle>
                <CardDescription>
                  Configure your compliance preferences and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive email alerts for compliance deadlines</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Tier Preferences</h4>
                      <p className="text-sm text-gray-600">Request tier changes or view current tier</p>
                    </div>
                    <Button variant="outline">Manage</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Document Retention</h4>
                      <p className="text-sm text-gray-600">Configure document storage preferences</p>
                    </div>
                    <Button variant="outline">Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Toaster />
    </div>
  );
};

export default Compliance;
