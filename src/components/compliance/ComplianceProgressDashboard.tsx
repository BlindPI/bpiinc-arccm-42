// File: src/components/compliance/ComplianceProgressDashboard.tsx

import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useComplianceProgress, useComplianceActivity } from '../../hooks/useComplianceRequirements';
import { useComplianceTier } from '../../hooks/useComplianceTier';
import { format, formatDistanceToNow } from 'date-fns';

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Award,
  Clipboard,
  UserCheck,
  BarChart4,
  PieChart,
} from 'lucide-react';

// Charting
import {
  ResponsiveContainer,
  PieChart as PieChartComponent,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export function ComplianceProgressDashboard() {
  const { user } = useAuth();
  const { data: tierInfo } = useComplianceTier(user?.id);
  const { data: progressData } = useComplianceProgress(user?.id || '');
  const { data: activityData } = useComplianceActivity(user?.id || '', 5);
  
  // Colors for charts
  const statusColors = {
    approved: '#10B981', // green
    submitted: '#3B82F6', // blue
    in_progress: '#F59E0B', // amber
    pending: '#6B7280', // gray
    rejected: '#EF4444', // red
  };
  
  // Format data for pie chart
  const pieChartData = useMemo(() => {
    if (!progressData) return [];
    
    return [
      {
        name: 'Completed',
        value: progressData.completion.completed,
        color: statusColors.approved,
      },
      {
        name: 'In Progress',
        value: progressData.completion.inProgress,
        color: statusColors.in_progress,
      },
      {
        name: 'Pending',
        value: progressData.completion.pending,
        color: statusColors.pending,
      },
    ];
  }, [progressData]);
  
  // Format data for bar chart by requirement type
  const typeChartData = useMemo(() => {
    if (!progressData?.byType) return [];
    
    return Object.entries(progressData.byType).map(([type, data]) => ({
      name: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown',
      completed: data.completed,
      remaining: data.total - data.completed,
    }));
  }, [progressData?.byType]);
  
  return (
    <div className="space-y-6">
      {/* Main progress overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Compliance Progress</CardTitle>
              <CardDescription>
                Your overall compliance completion status
              </CardDescription>
            </div>
            {tierInfo && (
              <Badge className="capitalize">
                {tierInfo.tier} Tier
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress bar and stats */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-2xl font-bold">
                  {progressData?.completion.percentage || 0}%
                </span>
              </div>
              <Progress
                value={progressData?.completion.percentage || 0}
                className="h-2.5"
              />
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <div className="mt-1 text-2xl font-bold text-green-600">
                    {progressData?.completion.completed || 0}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                  <div className="mt-1 text-2xl font-bold text-blue-600">
                    {progressData?.completion.inProgress || 0}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  <div className="mt-1 text-2xl font-bold text-gray-600">
                    {progressData?.completion.pending || 0}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Points earned */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">Points Earned</span>
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {progressData?.points.earned || 0} / {progressData?.points.total || 0}
                </div>
              </div>
              <Progress
                value={progressData?.points.percentage || 0}
                className="h-2 mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts and analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChartComponent>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} requirements`, 'Count']} />
              </PieChartComponent>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" name="Completed" fill={statusColors.approved} />
                <Bar dataKey="remaining" stackId="a" name="Remaining" fill={statusColors.pending} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Compliance Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityData && activityData.length > 0 ? (
              activityData.map((activity, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getActivityIcon(activity.action)}
                  <div>
                    <p className="font-medium">
                      {formatActivityAction(activity.action)}
                      {activity.requirementName && (
                        <span className="font-normal">: {activity.requirementName}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="w-full text-center text-sm text-muted-foreground">
            Showing {activityData?.length || 0} most recent activities
          </div>
        </CardFooter>
      </Card>
      
      {/* Requirement breakdown tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requirement Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="byType">
            <TabsList className="mb-4">
              <TabsTrigger value="byType">By Type</TabsTrigger>
              <TabsTrigger value="byStatus">By Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="byType">
              <div className="space-y-4">
                {typeChartData.map((type, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        {getTypeIcon(type.name)}
                        <span className="font-medium ml-2">{type.name}</span>
                      </div>
                      <div className="text-sm">
                        {type.completed} / {type.completed + type.remaining} completed
                      </div>
                    </div>
                    <Progress
                      value={(type.completed / (type.completed + type.remaining)) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="byStatus">
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-medium">Approved</span>
                    </div>
                    <div className="text-sm">
                      {progressData?.completion.completed || 0} requirements
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-medium">Submitted</span>
                    </div>
                    <div className="text-sm">
                      {progressData?.completion.inProgress || 0} requirements
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="font-medium">Pending</span>
                    </div>
                    <div className="text-sm">
                      {progressData?.completion.pending || 0} requirements
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get activity icon
function getActivityIcon(action: string): React.ReactNode {
  switch (action) {
    case 'requirement_submitted':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'requirement_approved':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'requirement_rejected':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'status_updated':
      return <FileText className="h-5 w-5 text-purple-500" />;
    case 'tier_changed':
      return <Award className="h-5 w-5 text-amber-500" />;
    default:
      return <FileText className="h-5 w-5 text-gray-500" />;
  }
}

// Helper function to format activity action
function formatActivityAction(action: string): string {
  switch (action) {
    case 'requirement_submitted':
      return 'Requirement submitted';
    case 'requirement_approved':
      return 'Requirement approved';
    case 'requirement_rejected':
      return 'Requirement needs revision';
    case 'status_updated':
      return 'Status updated';
    case 'tier_changed':
      return 'Compliance tier changed';
    default:
      return action.replace(/_/g, ' ');
  }
}

// Helper function to get type icon
function getTypeIcon(type: string): React.ReactNode {
  switch (type.toLowerCase()) {
    case 'document':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'certification':
      return <Award className="h-5 w-5 text-amber-500" />;
    case 'training':
      return <UserCheck className="h-5 w-5 text-green-500" />;
    case 'assessment':
      return <Clipboard className="h-5 w-5 text-purple-500" />;
    default:
      return <FileText className="h-5 w-5 text-gray-500" />;
  }
}

export default ComplianceProgressDashboard;