
import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { RealEnterpriseTeamHub } from './RealEnterpriseTeamHub';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Crown, Users, Shield, AlertTriangle } from 'lucide-react';

export function RealTeamManagementHub() {
  const { permissions, role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check for enterprise access
  if (!permissions.hasEnterpriseAccess) {
    return (
      <div className="space-y-6">
        {/* Professional Mode Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Professional Team Management
            </h1>
            <p className="text-muted-foreground">
              Standard team collaboration and member management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Professional Mode
            </Badge>
            <Badge variant="secondary">Current Role: {role}</Badge>
          </div>
        </div>

        {/* Limited Access Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Shield className="h-5 w-5" />
              Limited Access Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-amber-700">
                You're currently using Professional Team Management. This mode provides 
                basic team collaboration features suitable for standard operations.
              </p>
              
              <div className="bg-white/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-amber-800">Available Features:</h3>
                <ul className="space-y-1 text-sm text-amber-700">
                  <li>• Basic team creation and editing</li>
                  <li>• Standard member management</li>
                  <li>• Simple role assignments</li>
                  <li>• Basic team settings</li>
                </ul>
              </div>

              <div className="bg-amber-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-800">
                  <Crown className="h-4 w-4" />
                  Enterprise Features Available:
                </h3>
                <ul className="space-y-1 text-sm text-amber-700 mb-3">
                  <li>• Advanced role governance and progression</li>
                  <li>• Real-time compliance monitoring</li>
                  <li>• Cross-team analytics and reporting</li>
                  <li>• Workflow automation and approvals</li>
                  <li>• Bulk operations with progress tracking</li>
                  <li>• Location-based team assignments</li>
                </ul>
                
                <Link to="/enhanced-teams">
                  <Button className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Access Enterprise Teams
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Professional Features */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Team Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Team Creation</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create and configure basic teams with essential settings.
                    </p>
                    <Button size="sm" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Member Management</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add, remove, and manage team members with basic role assignments.
                    </p>
                    <Button size="sm" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Professional team management features are being developed. 
                  For full functionality, please use Enterprise Teams.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enterprise access granted - show full functionality
  return <RealEnterpriseTeamHub />;
}
