
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Users, 
  Crown, 
  Building2, 
  Shield, 
  BarChart3, 
  CheckCircle,
  ArrowRight 
} from 'lucide-react';

export function TeamModeSelector() {
  const { permissions, role } = useUserRole();
  const location = useLocation();
  
  const isOnEnhancedTeams = location.pathname === '/enhanced-teams';
  const isOnRegularTeams = location.pathname === '/teams';

  const modes = [
    {
      id: 'professional',
      title: 'Professional Teams',
      description: 'Standard team collaboration with member management and basic workflows',
      href: '/teams',
      icon: Users,
      features: [
        'Team member management',
        'Role assignments',
        'Basic reporting',
        'Team settings'
      ],
      active: isOnRegularTeams,
      available: true
    },
    {
      id: 'enterprise',
      title: 'Enterprise Teams',
      description: 'Advanced team governance with compliance, analytics, and cross-team management',
      href: '/enhanced-teams',
      icon: Crown,
      features: [
        'Advanced role governance',
        'Compliance monitoring',
        'Cross-team analytics',
        'Enterprise workflows',
        'Audit trails'
      ],
      active: isOnEnhancedTeams,
      available: permissions.hasEnterpriseAccess
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Team Management Modes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map((mode) => (
            <div
              key={mode.id}
              className={`border rounded-lg p-4 transition-all ${
                mode.active 
                  ? 'border-primary bg-primary/5' 
                  : mode.available 
                    ? 'border-border hover:border-primary/50' 
                    : 'border-muted bg-muted/30 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <mode.icon className={`h-5 w-5 ${mode.id === 'enterprise' ? 'text-yellow-600' : 'text-blue-600'}`} />
                  <h3 className="font-semibold">{mode.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {mode.active && (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {mode.id === 'enterprise' && (
                    <Crown className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {mode.description}
              </p>
              
              <div className="space-y-1 mb-4">
                {mode.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              {mode.available ? (
                <Link to={mode.href}>
                  <Button 
                    variant={mode.active ? "default" : "outline"} 
                    size="sm" 
                    className="w-full"
                    disabled={mode.active}
                  >
                    {mode.active ? (
                      'Current Mode'
                    ) : (
                      <>
                        Switch to {mode.title}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <Shield className="h-3 w-3 mr-1" />
                  Requires Enterprise Access
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {!permissions.hasEnterpriseAccess && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Enterprise team management is available for System Administrators, 
                Organization Administrators, and Authorized Providers.
                Current role: {role}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
