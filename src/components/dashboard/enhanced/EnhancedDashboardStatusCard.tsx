
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  User,
  MapPin,
  Building2
} from 'lucide-react';

interface EnhancedDashboardStatusCardProps {
  dashboardType: 'system' | 'ap_enhanced' | 'team_enhanced' | 'instructor' | 'student';
  healthStatus: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  teamContext?: {
    teamId: string;
    teamName: string;
    locationName: string;
    locationCity?: string;
    locationState?: string;
    apUserName?: string;
    apUserEmail?: string;
  };
}

export function EnhancedDashboardStatusCard({
  dashboardType,
  healthStatus,
  issues,
  recommendations,
  teamContext
}: EnhancedDashboardStatusCardProps) {
  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getHealthBadgeVariant = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getDashboardTypeLabel = () => {
    switch (dashboardType) {
      case 'system':
        return 'System Administrator';
      case 'ap_enhanced':
        return 'Authorized Provider';
      case 'team_enhanced':
        return 'Team Member';
      case 'instructor':
        return 'Instructor';
      case 'student':
        return 'Student';
      default:
        return 'User';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getHealthIcon()}
            Dashboard Status
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getDashboardTypeLabel()}</Badge>
            <Badge variant={getHealthBadgeVariant()}>
              {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context Information */}
        {teamContext && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{teamContext.teamName}</div>
                <div className="text-xs text-muted-foreground">Team/Context</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{teamContext.locationName}</div>
                <div className="text-xs text-muted-foreground">
                  {teamContext.locationCity && teamContext.locationState && 
                    `${teamContext.locationCity}, ${teamContext.locationState}`
                  }
                </div>
              </div>
            </div>
            
            {teamContext.apUserName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{teamContext.apUserName}</div>
                  <div className="text-xs text-muted-foreground">Provider/Manager</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Issues */}
        {issues.length > 0 && (
          <Alert variant={healthStatus === 'critical' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">
                  {issues.length === 1 ? 'Issue Detected:' : `${issues.length} Issues Detected:`}
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {issues.map((issue, index) => (
                    <li key={index} className="text-sm">{issue}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Recommendations:</div>
                <ul className="list-disc list-inside space-y-1">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Healthy Status */}
        {healthStatus === 'healthy' && issues.length === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All systems are functioning normally. Your dashboard is displaying accurate data.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
