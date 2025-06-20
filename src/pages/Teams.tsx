
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { RealTeamManagementHub } from '@/components/team/RealTeamManagementHub';
import { Crown, Users, ArrowRight, Shield, Building2 } from 'lucide-react';
import type { DatabaseUserRole } from '@/types/database-roles';
import { hasEnterpriseAccess } from '@/types/database-roles';

export default function Teams() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const userRole = profile?.role as DatabaseUserRole;
  const hasEnterprise = userRole ? hasEnterpriseAccess(userRole) : false;

  return (
    <div className="space-y-6">
      {/* Enterprise Feature Promotion for Qualified Users */}
      {hasEnterprise && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Enterprise Team Management Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Access advanced team management features including role governance, 
                  compliance monitoring, cross-team analytics, and enterprise workflows.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Advanced Role Management</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span>Multi-Location Teams</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>Cross-Team Analytics</span>
                  </div>
                </div>
              </div>
              <Link to="/enhanced-teams">
                <Button className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Access Enterprise Teams
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Team Management Mode Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Professional team collaboration with real database integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Professional Mode
          </Badge>
          {hasEnterprise && (
            <Badge variant="secondary" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Enterprise Available
            </Badge>
          )}
        </div>
      </div>

      {/* Real Team Management Hub */}
      <RealTeamManagementHub />
    </div>
  );
}
