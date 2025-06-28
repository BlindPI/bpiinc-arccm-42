
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RealTimeDashboardWidget } from '../RealTimeDashboardWidget';
import { DashboardDataService } from '@/services/dashboard/dashboardDataService';
import { 
  Award, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProviderDashboardProps {
  teamContext?: any;
  config: any;
  profile: any;
}

export default function ProviderDashboard({ teamContext, config, profile }: ProviderDashboardProps) {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['provider-metrics', profile.id],
    queryFn: () => DashboardDataService.getAPUserMetrics(profile.id),
    refetchInterval: 30000
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ['provider-activities', profile.id],
    queryFn: () => DashboardDataService.getRecentActivities(profile.id, 'AP'),
    refetchInterval: 60000
  });

  return (
    <div className="space-y-6">
      {/* Location Context Header */}
      {metrics?.locationName && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-blue-900">{metrics.locationName}</h2>
                  <p className="text-blue-700">
                    {metrics.locationCity}, {metrics.locationState}
                  </p>
                  {metrics.locationAddress && (
                    <p className="text-sm text-blue-600">{metrics.locationAddress}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-900">{metrics.apUserName}</p>
                <div className="flex items-center gap-4 text-sm text-blue-700 mt-1">
                  {metrics.apUserEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {metrics.apUserEmail}
                    </span>
                  )}
                  {metrics.apUserPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {metrics.apUserPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RealTimeDashboardWidget
          title="Active Certificates"
          icon={Award}
          value={metrics?.activeCertifications}
          status="success"
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
          actions={[
            { label: 'View All', onClick: () => window.location.href = '/certificates' }
          ]}
        />

        <RealTimeDashboardWidget
          title="Expiring Soon"
          icon={AlertTriangle}
          value={metrics?.expiringSoon}
          status={metrics?.expiringSoon > 5 ? "warning" : "success"}
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
          actions={[
            { label: 'Review', onClick: () => console.log('Review expiring certificates') }
          ]}
        />

        <RealTimeDashboardWidget
          title="Compliance Issues"
          icon={AlertTriangle}
          value={metrics?.complianceIssues || 0}
          status={metrics?.complianceIssues > 0 ? "error" : "success"}
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
        />
      </div>

      {/* Location Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeDashboardWidget
          title="Location Performance"
          icon={TrendingUp}
          isLoading={isLoading}
          realTime
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Certification Rate</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">98.5%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Compliance Score</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">94%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Customer Satisfaction</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">4.8/5</Badge>
            </div>
          </div>
        </RealTimeDashboardWidget>

        <RealTimeDashboardWidget
          title="Recent Activity"
          icon={Calendar}
          isLoading={isLoading}
          realTime
          size="md"
        >
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.entity_type}
                </Badge>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activities
              </p>
            )}
          </div>
        </RealTimeDashboardWidget>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/certificates'}
              className="h-20 flex flex-col gap-2"
            >
              <Award className="h-6 w-6" />
              <span className="text-sm">Certificates</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/teams'}
              className="h-20 flex flex-col gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Teams</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => console.log('Schedule training')}
              className="h-20 flex flex-col gap-2"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/analytics'}
              className="h-20 flex flex-col gap-2"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
