
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Building2, Settings, UserPlus, Eye } from 'lucide-react';

// Import role-specific components
import { AdminTeamManagement } from './admin/AdminTeamManagement';
import { InstructorTeamView } from './instructor/InstructorTeamView';
import { StudentTeamView } from './student/StudentTeamView';
import { ProviderTeamManagement } from './provider/ProviderTeamManagement';
import { UniversalTeamCreator } from './universal/UniversalTeamCreator';

export function RoleBasedTeamManager() {
  const { user } = useAuth();
  const { userRole, isAdmin, isInstructor, loading } = useRoleBasedAccess();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
        <p className="text-muted-foreground">Please log in to access team management.</p>
      </div>
    );
  }

  // Determine available tabs based on user role
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'overview', label: 'Overview', icon: Eye }
    ];

    if (isAdmin()) {
      baseTabs.push(
        { id: 'admin', label: 'Admin Management', icon: Shield },
        { id: 'create', label: 'Create Team', icon: UserPlus },
        { id: 'settings', label: 'System Settings', icon: Settings }
      );
    } else if (isInstructor()) {
      baseTabs.push(
        { id: 'instructor', label: 'My Teams', icon: Users },
        { id: 'create', label: 'Create Team', icon: UserPlus }
      );
    } else if (userRole === 'AP') {
      baseTabs.push(
        { id: 'provider', label: 'Provider Teams', icon: Building2 },
        { id: 'create', label: 'Create Team', icon: UserPlus }
      );
    } else {
      baseTabs.push(
        { id: 'student', label: 'My Teams', icon: Users }
      );
    }

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage teams, members, and collaboration based on your role
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {userRole}
          </Badge>
          {(isAdmin() || isInstructor() || userRole === 'AP') && (
            <UniversalTeamCreator userRole={userRole} />
          )}
        </div>
      </div>

      {/* Role-Based Content */}
      <Card className="border-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b bg-muted/30">
            <TabsList className="w-full justify-start bg-transparent">
              {availableTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    className="capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardHeader>

          <CardContent className="p-6">
            <TabsContent value="overview">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Your Role</p>
                          <p className="text-lg font-bold">{userRole}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Access Level</p>
                          <p className="text-lg font-bold">
                            {isAdmin() ? 'Admin' : isInstructor() ? 'Instructor' : 'Member'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Team Features</p>
                          <p className="text-lg font-bold">Available</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Welcome to Team Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Based on your role ({userRole}), you have access to the following team management features:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isAdmin() && (
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Admin Features</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Create and manage all teams</li>
                              <li>• Assign team members and roles</li>
                              <li>• System-wide team settings</li>
                              <li>• Performance analytics</li>
                            </ul>
                          </div>
                        )}
                        
                        {isInstructor() && (
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Instructor Features</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• View and manage your teams</li>
                              <li>• Create instructor teams</li>
                              <li>• Track team performance</li>
                              <li>• Manage team assignments</li>
                            </ul>
                          </div>
                        )}
                        
                        {userRole === 'AP' && (
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Provider Features</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Manage provider teams</li>
                              <li>• Location-based team management</li>
                              <li>• Provider performance tracking</li>
                              <li>• Team workflow management</li>
                            </ul>
                          </div>
                        )}
                        
                        {!isAdmin() && !isInstructor() && userRole !== 'AP' && (
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Member Features</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• View your team memberships</li>
                              <li>• Participate in team activities</li>
                              <li>• Track your progress</li>
                              <li>• Team communication</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {isAdmin() && (
              <>
                <TabsContent value="admin">
                  <AdminTeamManagement />
                </TabsContent>
                <TabsContent value="settings">
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>System team settings</p>
                  </div>
                </TabsContent>
              </>
            )}

            {isInstructor() && (
              <TabsContent value="instructor">
                <InstructorTeamView />
              </TabsContent>
            )}

            {userRole === 'AP' && (
              <TabsContent value="provider">
                <ProviderTeamManagement />
              </TabsContent>
            )}

            {!isAdmin() && !isInstructor() && userRole !== 'AP' && (
              <TabsContent value="student">
                <StudentTeamView />
              </TabsContent>
            )}

            {(isAdmin() || isInstructor() || userRole === 'AP') && (
              <TabsContent value="create">
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Team creation interface will appear here</p>
                </div>
              </TabsContent>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
