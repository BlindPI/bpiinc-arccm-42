import React, { useState } from 'react';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';
import { ConsolidatedAnalyticsDashboard } from '@/components/analytics/ConsolidatedAnalyticsDashboard';
import CertificateAnalyticsDashboard from '@/components/analytics/CertificateAnalyticsDashboard';
import InstructorPerformanceDashboard from '@/components/analytics/InstructorPerformanceDashboard';
import { ExecutiveDashboard } from '@/components/crm/analytics/ExecutiveDashboard';
import { AdvancedRevenueAnalytics } from '@/components/crm/analytics/AdvancedRevenueAnalytics';
import { useProfile } from '@/hooks/useProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Award, 
  Users, 
  DollarSign, 
  BarChart3,
  Crown
} from 'lucide-react';

export default function Analytics() {
  const { data: profile, isLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('overview');
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const userRole = profile?.role;
  const isEnterprise = ['SA', 'AD', 'AP'].includes(userRole);
  const isAdmin = ['SA', 'AD'].includes(userRole);
  const isAP = userRole === 'AP';

  // AP users get specialized dashboard
  if (isAP) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Crown className="h-6 w-6 text-yellow-600" />
          <h1 className="text-3xl font-bold tracking-tight">Authorized Provider Analytics</h1>
        </div>
        <ConsolidatedAnalyticsDashboard userRole="AP" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Hub</h1>
        <p className="text-muted-foreground">
          Comprehensive business intelligence and performance analytics
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          
          {isAdmin && (
            <TabsTrigger value="certificates" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Certificates</span>
            </TabsTrigger>
          )}
          
          {isEnterprise && (
            <TabsTrigger value="instructors" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Instructors</span>
            </TabsTrigger>
          )}
          
          <TabsTrigger value="revenue" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Revenue</span>
          </TabsTrigger>
          
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trends</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="certificates" className="space-y-6">
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-bold">Certificate Analytics</h2>
              <p className="text-muted-foreground">
                Comprehensive certificate performance and compliance metrics
              </p>
            </div>
            <CertificateAnalyticsDashboard />
          </TabsContent>
        )}

        {isEnterprise && (
          <TabsContent value="instructors" className="space-y-6">
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-bold">Instructor Performance</h2>
              <p className="text-muted-foreground">
                Training effectiveness and instructor performance analytics
              </p>
            </div>
            <InstructorPerformanceDashboard />
          </TabsContent>
        )}

        <TabsContent value="revenue" className="space-y-6">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">Revenue Analytics</h2>
            <p className="text-muted-foreground">
              Financial performance and business intelligence
            </p>
          </div>
          <ExecutiveDashboard />
          <AdvancedRevenueAnalytics />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Advanced Trend Analysis</span>
              </CardTitle>
              <CardDescription>
                Long-term patterns and predictive analytics across all business metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedAnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
