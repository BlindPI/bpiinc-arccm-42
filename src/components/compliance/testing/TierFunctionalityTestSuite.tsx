import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceDashboardProvider } from '@/contexts/ComplianceDashboardContext';
import { TierComparisonMatrix } from '@/components/compliance/views/TierComparisonMatrix';
import { EnhancedComplianceTierManager } from '@/components/compliance/enhanced/EnhancedComplianceTierManager';
import { TierSwitchRequestDialog } from '@/components/compliance/requests/TierSwitchRequestDialog';
import { 
  Users, 
  Shield, 
  FileText, 
  Settings, 
  TestTube,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';

interface TestUser {
  id: string;
  name: string;
  role: 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';
  tier: 'basic' | 'robust';
  canManage: boolean;
  scenario: string;
}

const testUsers: TestUser[] = [
  {
    id: 'test-sa-1',
    name: 'Sarah Admin',
    role: 'SA',
    tier: 'robust',
    canManage: true,
    scenario: 'System Administrator - Full management capabilities'
  },
  {
    id: 'test-ad-1',
    name: 'Mike Admin',
    role: 'AD',
    tier: 'robust',
    canManage: true,
    scenario: 'Admin - Can manage tier changes'
  },
  {
    id: 'test-ap-1',
    name: 'Lisa Provider',
    role: 'AP',
    tier: 'basic',
    canManage: false,
    scenario: 'Authorized Provider - Basic tier, needs upgrade'
  },
  {
    id: 'test-ap-2',
    name: 'John Provider Pro',
    role: 'AP',
    tier: 'robust',
    canManage: false,
    scenario: 'Authorized Provider - Already on robust tier'
  },
  {
    id: 'test-ic-1',
    name: 'Emma Instructor',
    role: 'IC',
    tier: 'basic',
    canManage: false,
    scenario: 'Instructor Certified - Basic tier, considering upgrade'
  },
  {
    id: 'test-ip-1',
    name: 'David Provisional',
    role: 'IP',
    tier: 'basic',
    canManage: false,
    scenario: 'Instructor Provisional - Basic tier'
  },
  {
    id: 'test-it-1',
    name: 'Anna Trainee',
    role: 'IT',
    tier: 'basic',
    canManage: false,
    scenario: 'Instructor Trainee - Basic tier only'
  }
];

export function TierFunctionalityTestSuite() {
  const [selectedUser, setSelectedUser] = useState<TestUser>(testUsers[0]);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const markTestComplete = (testId: string) => {
    setTestResults(prev => ({ ...prev, [testId]: true }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SA':
      case 'AD':
        return <Settings className="h-4 w-4" />;
      case 'AP':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTierIcon = (tier: string) => {
    return tier === 'basic' ? <FileText className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const TestChecklist = ({ testId, title, children }: { testId: string; title: string; children: React.ReactNode }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            {title}
          </span>
          <Button
            size="sm"
            variant={testResults[testId] ? "default" : "outline"}
            onClick={() => markTestComplete(testId)}
          >
            {testResults[testId] ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-1" />
                Test
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Phase 2 Complete: Tier Visibility Testing</h1>
          <p className="text-muted-foreground">
            Test tier comparison matrix, enhanced tier management, and request workflows across different user roles
          </p>
        </div>

        <Tabs defaultValue="user-selection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="user-selection">User Selection</TabsTrigger>
            <TabsTrigger value="tier-comparison">Tier Comparison</TabsTrigger>
            <TabsTrigger value="tier-management">Tier Management</TabsTrigger>
            <TabsTrigger value="test-checklist">Test Results</TabsTrigger>
          </TabsList>

          {/* User Selection Tab */}
          <TabsContent value="user-selection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Test User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testUsers.map((user) => (
                    <Card
                      key={user.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedUser.id === user.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getRoleIcon(user.role)}
                              <span className="font-medium">{user.name}</span>
                            </div>
                            {selectedUser.id === user.id && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {getTierIcon(user.tier)}
                              {user.tier}
                            </Badge>
                            {user.canManage && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground">{user.scenario}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected User Info */}
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                <strong>Selected User:</strong> {selectedUser.name} ({selectedUser.role}) - {selectedUser.tier} tier
                {selectedUser.canManage ? ' with management permissions' : ' without management permissions'}
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Tier Comparison Tab */}
          <TabsContent value="tier-comparison" className="space-y-6">
            <ComplianceDashboardProvider
              userId={selectedUser.id}
              userRole={selectedUser.role}
              displayName={selectedUser.name}
            >
              <TierComparisonMatrix
                currentUserId={selectedUser.id}
                currentUserRole={selectedUser.role}
                onTierSelect={(tier) => {
                  console.log(`Tier selected: ${tier} for user ${selectedUser.name}`);
                  markTestComplete('tier-comparison');
                }}
                showUpgradeOption={selectedUser.canManage}
              />
            </ComplianceDashboardProvider>
          </TabsContent>

          {/* Tier Management Tab */}
          <TabsContent value="tier-management" className="space-y-6">
            <ComplianceDashboardProvider
              userId={selectedUser.id}
              userRole={selectedUser.role}
              displayName={selectedUser.name}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enhanced Tier Manager */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Enhanced Tier Manager</h3>
                  <EnhancedComplianceTierManager
                    userId={selectedUser.id}
                    userRole={selectedUser.role}
                    userName={selectedUser.name}
                    canManage={selectedUser.canManage}
                    showComparison={true}
                  />
                </div>

                {/* Tier Switch Request */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tier Switch Request</h3>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.canManage 
                          ? "As an admin, you can directly change tiers or use the request system to track changes."
                          : "Users without management permissions must request tier changes through the approval workflow."
                        }
                      </p>
                      
                      <div className="space-y-3">
                        {selectedUser.tier === 'basic' && (
                          <TierSwitchRequestDialog
                            userId={selectedUser.id}
                            currentTier={selectedUser.tier}
                            requestedTier="robust"
                            userName={selectedUser.name}
                            userRole={selectedUser.role}
                            trigger={
                              <Button className="w-full">
                                Request Upgrade to Robust Tier
                              </Button>
                            }
                          />
                        )}
                        
                        {selectedUser.tier === 'robust' && (
                          <TierSwitchRequestDialog
                            userId={selectedUser.id}
                            currentTier={selectedUser.tier}
                            requestedTier="basic"
                            userName={selectedUser.name}
                            userRole={selectedUser.role}
                            trigger={
                              <Button variant="outline" className="w-full">
                                Request Downgrade to Basic Tier
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ComplianceDashboardProvider>
          </TabsContent>

          {/* Test Checklist Tab */}
          <TabsContent value="test-checklist" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Functional Tests</h3>
                
                <TestChecklist testId="tier-comparison" title="Tier Comparison Matrix">
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Side-by-side Basic vs Robust comparison displays</li>
                    <li>Requirement differences are clearly shown</li>
                    <li>Current tier is highlighted</li>
                    <li>Upgrade impact preview works</li>
                  </ul>
                </TestChecklist>

                <TestChecklist testId="tier-manager" title="Enhanced Tier Manager">
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Real-time progress indicators work</li>
                    <li>Completion percentage updates</li>
                    <li>Visual progress bars display correctly</li>
                    <li>Auto-refresh functionality works</li>
                  </ul>
                </TestChecklist>

                <TestChecklist testId="tier-requests" title="Tier Switch Requests">
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Request dialog opens and submits properly</li>
                    <li>Justification field validation works</li>
                    <li>Previous request history displays</li>
                    <li>Pending request warnings show</li>
                  </ul>
                </TestChecklist>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Permission Tests</h3>
                
                <TestChecklist testId="admin-permissions" title="Admin User Permissions">
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Direct tier switching available</li>
                    <li>All management features accessible</li>
                    <li>Upgrade buttons work immediately</li>
                    <li>Impact preview shows correctly</li>
                  </ul>
                </TestChecklist>

                <TestChecklist testId="user-permissions" title="Regular User Permissions">
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Request workflow required for changes</li>
                    <li>Direct tier switching disabled</li>
                    <li>Comparison view works without changes</li>
                    <li>Request submission notifications work</li>
                  </ul>
                </TestChecklist>

                <TestChecklist testId="role-variations" title="Role-Specific Behavior">
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Different requirements shown per role</li>
                    <li>Tier templates load correctly</li>
                    <li>Role-appropriate messaging displays</li>
                    <li>Completion calculations are accurate</li>
                  </ul>
                </TestChecklist>
              </div>
            </div>

            {/* Test Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Test Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Tests Completed:</span>
                  <Badge variant="secondary">
                    {Object.values(testResults).filter(Boolean).length} / 6
                  </Badge>
                </div>
                {Object.values(testResults).filter(Boolean).length === 6 && (
                  <Alert className="mt-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-700">
                      <strong>Phase 2 Testing Complete!</strong> All tier visibility features have been successfully tested.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}