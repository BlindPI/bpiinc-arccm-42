
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Activity,
  TrendingUp,
  Shield
} from 'lucide-react';
import { RealTimeMemberManagement } from './RealTimeMemberManagement';
import { BulkOperationsManager } from './BulkOperationsManager';
import { RealTimeAnalyticsDashboard } from '@/components/analytics/RealTimeAnalyticsDashboard';
import { ExecutiveReportBuilder } from '@/components/analytics/ExecutiveReportBuilder';

export const EnhancedTeamManagementHub: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time Analytics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live</div>
            <p className="text-xs text-muted-foreground">
              Performance tracking with predictive insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executive Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Automated</div>
            <p className="text-xs text-muted-foreground">
              Custom report generation and delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enterprise Features</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Advanced compliance and risk management
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Interface */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Real-time Analytics
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Member Management
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Bulk Operations
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Executive Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Real-time Analytics Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Live performance tracking, predictive insights, and location heatmaps
              </p>
            </div>
            <Badge variant="default">Live Data</Badge>
          </div>
          <RealTimeAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Enhanced Member Management</h3>
              <p className="text-sm text-muted-foreground">
                Skills tracking, emergency contacts, activity monitoring, and compliance management
              </p>
            </div>
            <Badge variant="secondary">Enterprise</Badge>
          </div>
          <RealTimeMemberManagement />
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Bulk Operations Management</h3>
              <p className="text-sm text-muted-foreground">
                Async processing, progress tracking, rollback capabilities, and audit trails
              </p>
            </div>
            <Badge variant="outline">Advanced</Badge>
          </div>
          <BulkOperationsManager />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Executive Report Builder</h3>
              <p className="text-sm text-muted-foreground">
                Custom report creation, automated generation, and multi-format export
              </p>
            </div>
            <Badge variant="default">Automated</Badge>
          </div>
          <ExecutiveReportBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
};
