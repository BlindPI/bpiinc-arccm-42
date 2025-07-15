
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  UserPlus,
  AlertCircle,
  Search,
  Filter,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Activity
} from "lucide-react";
import { useEnrollmentMetrics, useFilteredEnrollments, useEnrollmentTrends } from '@/hooks/useEnrollmentAnalytics';
import { EnrollmentTable } from './EnrollmentTable';
import { WaitlistManager } from './WaitlistManager';
import { BulkEnrollmentForm } from './BulkEnrollmentForm';
import { EnrollmentStats } from './EnrollmentStats';
import { ManualEnrollmentForm } from './ManualEnrollmentForm';
import { EnhancedManualEnrollmentForm } from './EnhancedManualEnrollmentForm';
import { RosterManagement } from './RosterManagement';
import { EnrollmentAnalyticsDashboard } from './analytics/EnrollmentAnalyticsDashboard';
import { SystemStatus } from './SystemStatus';
import { EnrollmentService, type EnrollmentWithDetails } from '@/services/enrollment/enrollmentService';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function EnrollmentManagementDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: metrics, isLoading: metricsLoading } = useEnrollmentMetrics();
  const { data: trends } = useEnrollmentTrends();
  
  const filters = {
    ...(statusFilter && { status: statusFilter }),
  };
  
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useFilteredEnrollments(filters);

  // Export functionality
  const { mutate: exportData, isPending: isExporting } = useMutation({
    mutationFn: () => EnrollmentService.exportEnrollmentData(filters),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enrollments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Enrollment data exported successfully');
    },
    onError: (error) => {
      toast.error('Failed to export data: ' + error.message);
    }
  });

  // Approval/Rejection functionality
  const { mutate: approveEnrollment } = useMutation({
    mutationFn: ({ enrollmentId }: { enrollmentId: string }) =>
      EnrollmentService.approveEnrollment(enrollmentId, 'current-user-id'),
    onSuccess: () => {
      toast.success('Enrollment approved');
      queryClient.invalidateQueries({ queryKey: ['enrollments-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-metrics'] });
    },
    onError: (error) => {
      toast.error('Failed to approve enrollment: ' + error.message);
    }
  });

  const { mutate: rejectEnrollment } = useMutation({
    mutationFn: ({ enrollmentId, reason }: { enrollmentId: string; reason: string }) =>
      EnrollmentService.rejectEnrollment(enrollmentId, reason),
    onSuccess: () => {
      toast.success('Enrollment updated');
      queryClient.invalidateQueries({ queryKey: ['enrollments-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-metrics'] });
    },
    onError: (error) => {
      toast.error('Failed to update enrollment: ' + error.message);
    }
  });


  // Filter enrollments by search term
  const filteredEnrollments = enrollments.filter((enrollment: EnrollmentWithDetails) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      enrollment.profiles?.display_name?.toLowerCase().includes(searchLower) ||
      enrollment.profiles?.email?.toLowerCase().includes(searchLower) ||
      enrollment.course_offerings?.courses?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getTrendIcon = () => {
    if (!trends) return <Minus className="h-4 w-4 text-gray-500" />;
    switch (trends.growth) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrollment Management</h1>
          <p className="text-muted-foreground">
            Manage course enrollments, waitlists, and student registrations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportData()}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="enrollments">All Enrollments</TabsTrigger>
          <TabsTrigger value="rosters">Roster Management</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist Management</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricsLoading ? '...' : metrics?.totalEnrollments || 0}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTrendIcon()}
                  <span className="ml-1">
                    {trends?.trends.percentageChange.toFixed(1)}% from last month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricsLoading ? '...' : metrics?.activeEnrollments || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently enrolled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Waitlisted</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricsLoading ? '...' : metrics?.waitlistCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting spots
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricsLoading ? '...' : metrics?.completedCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Finished courses
                </p>
              </CardContent>
            </Card>
          </div>


          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <EnrollmentTable 
                enrollments={filteredEnrollments.slice(0, 10)} 
                isLoading={enrollmentsLoading}
                compact
                onApprove={(id) => approveEnrollment({ enrollmentId: id })}
                onReject={(id, reason) => rejectEnrollment({ enrollmentId: id, reason })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <SystemStatus />
          <EnrollmentAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <EnhancedManualEnrollmentForm />
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search enrollments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="ENROLLED">Enrolled</option>
              <option value="WAITLISTED">Waitlisted</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <EnrollmentTable 
                enrollments={filteredEnrollments} 
                isLoading={enrollmentsLoading}
                searchTerm={searchTerm}
                onApprove={(id) => approveEnrollment({ enrollmentId: id })}
                onReject={(id, reason) => rejectEnrollment({ enrollmentId: id, reason })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rosters" className="space-y-4">
          <RosterManagement />
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          <WaitlistManager />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkEnrollmentForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
