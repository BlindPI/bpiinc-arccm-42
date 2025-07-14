import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  TrendingUp,
  Bell,
  Eye,
  X
} from "lucide-react";
import { RealTimeStatus } from '@/services/analytics/enrollmentAnalyticsService';

interface RealTimeStatusPanelProps {
  status?: RealTimeStatus;
  onRefresh: () => void;
  autoRefresh: boolean;
}

export function RealTimeStatusPanel({ status, onRefresh, autoRefresh }: RealTimeStatusPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No real-time data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const activeAlerts = status.alerts.filter(alert => !dismissedAlerts.includes(alert.id));
  const totalStudents = status.totalActive + status.pendingApproval + status.inProgress + status.completed;

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className={`h-5 w-5 ${autoRefresh ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
                Real-time Enrollment Status
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Live monitoring of enrollment system activity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={autoRefresh ? "default" : "secondary"}>
                {autoRefresh ? 'Live Updates' : 'Manual Refresh'}
              </Badge>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(status.lastUpdated).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Live Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {status.totalActive}
            </div>
            <Progress 
              value={totalStudents > 0 ? (status.totalActive / totalStudents) * 100 : 0} 
              className="mt-2 h-1" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {totalStudents > 0 ? ((status.totalActive / totalStudents) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {status.pendingApproval}
            </div>
            <Progress 
              value={totalStudents > 0 ? (status.pendingApproval / totalStudents) * 100 : 0} 
              className="mt-2 h-1" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {status.inProgress}
            </div>
            <Progress 
              value={totalStudents > 0 ? (status.inProgress / totalStudents) * 100 : 0} 
              className="mt-2 h-1" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Currently training
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {status.completed}
            </div>
            <Progress 
              value={totalStudents > 0 ? (status.completed / totalStudents) * 100 : 0} 
              className="mt-2 h-1" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Finished training
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Live Alerts ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between p-3 rounded-lg ${
                    alert.type === 'error' ? 'bg-red-50 border border-red-200' :
                    alert.type === 'warning' ? 'bg-orange-50 border border-orange-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === 'error' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        alert.type === 'error' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-orange-800' :
                        'text-blue-800'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissAlert(alert.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enrollment System</span>
              <Badge variant="default" className="bg-green-500">
                Operational
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Roster Management</span>
              <Badge variant="default" className="bg-green-500">
                Operational
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Certificate Generation</span>
              <Badge variant="outline" className="text-orange-600">
                Delayed
              </Badge>
            </div>
            
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Overall Status</p>
              <p className="text-sm text-green-600">All systems operational</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-muted rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div className="text-sm">
                  <p>3 enrollments processed</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-muted rounded">
                <Users className="h-4 w-4 text-blue-500" />
                <div className="text-sm">
                  <p>New roster created for Course ABC</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-muted rounded">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <div className="text-sm">
                  <p>Certificate processing delayed</p>
                  <p className="text-xs text-muted-foreground">8 minutes ago</p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Eye className="h-4 w-4 mr-2" />
              View Full Activity Log
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}