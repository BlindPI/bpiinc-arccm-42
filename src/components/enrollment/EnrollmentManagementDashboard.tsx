
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Calendar, 
  UserPlus, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Upload
} from "lucide-react";
import { useEnrollments, useUserEnrollments } from '@/hooks/useEnrollment';
import { EnrollmentTable } from './EnrollmentTable';
import { WaitlistManager } from './WaitlistManager';
import { BulkEnrollmentForm } from './BulkEnrollmentForm';
import { EnrollmentStats } from './EnrollmentStats';

export function EnrollmentManagementDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffering, setSelectedOffering] = useState<string>('');

  const { data: enrollments = [], isLoading } = useEnrollments();

  const stats = {
    totalEnrollments: enrollments.length,
    activeEnrollments: enrollments.filter(e => e.status === 'ENROLLED').length,
    waitlistCount: enrollments.filter(e => e.status === 'WAITLISTED').length,
    completedCount: enrollments.filter(e => e.status === 'COMPLETED').length,
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <EnrollmentStats stats={stats} isLoading={isLoading} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollments">All Enrollments</TabsTrigger>
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
                <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  Across all courses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
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
                <div className="text-2xl font-bold">{stats.waitlistCount}</div>
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
                <div className="text-2xl font-bold">{stats.completedCount}</div>
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
                enrollments={enrollments.slice(0, 10)} 
                isLoading={isLoading}
                compact
              />
            </CardContent>
          </Card>
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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <EnrollmentTable 
                enrollments={enrollments} 
                isLoading={isLoading}
                searchTerm={searchTerm}
              />
            </CardContent>
          </Card>
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
