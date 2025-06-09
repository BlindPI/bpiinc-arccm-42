
import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { RealEnterpriseTeamHub } from '@/components/team/RealEnterpriseTeamHub';
import { TeamModeSelector } from '@/components/team/TeamModeSelector';
import { Crown, Users, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';

export default function EnhancedTeams() {
  const { permissions, role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Access Control - Only SA, AD, AP roles can access Enterprise features
  if (!permissions.hasEnterpriseAccess) {
    return (
      <div className="space-y-6">
        {/* Access Denied Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-600" />
              Enterprise Team Management
            </h1>
            <p className="text-muted-foreground">
              Advanced team governance and analytics platform
            </p>
          </div>
          <Link to="/teams">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
        </div>

        {/* Access Denied Message */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Enterprise team management features require elevated privileges. 
                Your current role ({role}) does not have access to these features.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Required Roles for Enterprise Access:
                </h3>
                <ul className="space-y-1 text-sm">
                  <li>• System Administrator (SA)</li>
                  <li>• Organization Administrator (AD)</li>
                  <li>• Authorized Provider (AP)</li>
                </ul>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/teams">
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Use Professional Teams
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mode Selector for Reference */}
        <TeamModeSelector />
      </div>
    );
  }

  // Enterprise Access Granted
  return (
    <div className="space-y-6">
      {/* Enterprise Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-600" />
            Enterprise Team Management
          </h1>
          <p className="text-muted-foreground">
            Advanced team governance, analytics, and compliance monitoring with real database integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Crown className="h-3 w-3" />
            Enterprise Mode
          </Badge>
          <Link to="/teams">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Professional Mode
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Enterprise Team Hub */}
      <RealEnterpriseTeamHub />
    </div>
  );
}
