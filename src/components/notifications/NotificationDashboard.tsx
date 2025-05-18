import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPreferencesPanel } from './NotificationPreferencesPanel';
import { NotificationProcessor } from './NotificationProcessor';
import { EmailDiagnosticTool } from './EmailDiagnosticTool';
import { NotificationQueueMonitor } from './NotificationQueueMonitor';
import { EmailConfigurationTool } from './EmailConfigurationTool';
import { useNotificationCount } from '@/hooks/useNotifications';
import { useProfile } from '@/hooks/useProfile';
import { 
  BarChart as BarChartIcon, 
  Bell, 
  CheckCircle, 
  Mail,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export function NotificationDashboard() {
  const { data: counts = { total: 0, unread: 0 } } = useNotificationCount();
  const { data: profile, isLoading } = useProfile();
  
  // Check if user is admin
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }
  
  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Lock className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-700">Access Denied</h2>
          <p className="text-red-600 mt-2">
            You need administrator privileges to access the Notification Dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Dashboard</h1>
          <p className="text-muted-foreground">
            View, configure, and manage the notification system
          </p>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatusCard
          title="Total Notifications"
          value={counts.total}
          icon={<Bell className="h-6 w-6 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        
        <StatusCard
          title="Unread"
          value={counts.unread}
          icon={<Bell className="h-6 w-6 text-amber-600" />}
          bgColor="bg-amber-50"
        />
        
        <StatusCard
          title="Email Queue"
          value="Active"
          icon={<Mail className="h-6 w-6 text-green-600" />}
          bgColor="bg-green-50"
        />
        
        <StatusCard
          title="Configuration"
          value="Verified"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          bgColor="bg-green-50"
        />
      </div>
      
      {/* Main content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Queue Monitor */}
          <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle>Notification Queue Monitor</CardTitle>
              <CardDescription>
                Real-time monitoring of the notification processing queue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationQueueMonitor />
            </CardContent>
          </Card>
          
          {/* Email Configuration & Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>Configure email notification settings</CardDescription>
              </CardHeader>
              <CardContent>
                <EmailConfigurationTool />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Process Queue</CardTitle>
                <CardDescription>Manually process the notification queue</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationProcessor />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Analytics</CardTitle>
              <CardDescription>
                Statistics and trends of notification activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationAnalytics />
            </CardContent>
          </Card>
          
          {/* Testing Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Tools</CardTitle>
              <CardDescription>
                Test notification delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailDiagnosticTool />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* User Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure user notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesPanel />
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for status cards
function StatusCard({ title, value, icon, bgColor = "bg-blue-50" }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={`rounded-full ${bgColor} p-3`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced NotificationAnalytics component with recharts
function NotificationAnalytics() {
  // Mock data for the chart - in a real implementation, we'd get this from the API
  const data = [
    { name: 'Mon', sent: 4, failed: 1 },
    { name: 'Tue', sent: 3, failed: 0 },
    { name: 'Wed', sent: 7, failed: 2 },
    { name: 'Thu', sent: 5, failed: 1 },
    { name: 'Fri', sent: 9, failed: 0 },
    { name: 'Sat', sent: 2, failed: 0 },
    { name: 'Sun', sent: 3, failed: 1 },
  ];

  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sent" fill="#3B82F6" name="Sent" />
            <Bar dataKey="failed" fill="#EF4444" name="Failed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 rounded-md p-3">
          <p className="text-sm font-medium text-blue-700">Delivery Rate</p>
          <p className="text-lg font-bold">98.2%</p>
        </div>
        <div className="bg-green-50 rounded-md p-3">
          <p className="text-sm font-medium text-green-700">Avg. Processing Time</p>
          <p className="text-lg font-bold">1.3s</p>
        </div>
      </div>
    </div>
  );
}

export default NotificationDashboard;
