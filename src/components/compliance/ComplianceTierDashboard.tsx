import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Shield, 
  FileText, 
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';

export function ComplianceTierDashboard() {
  const [statistics, setStatistics] = useState({
    basic_tier_users: 0,
    robust_tier_users: 0,
    basic_completion_avg: 0,
    robust_completion_avg: 0
  });
  const [allUsers, setAllUsers] = useState<Array<{
    user_id: string;
    display_name?: string;
    email?: string;
    role: string;
    tier: 'basic' | 'robust';
    completion_percentage: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('🔧 DEBUG: Loading dashboard data...');
      
      // FIX: Call getAllUsersComplianceTiers only once and calculate statistics locally
      // This prevents the race condition where getComplianceTierStatistics() also calls getAllUsersComplianceTiers()
      const users = await ComplianceTierService.getAllUsersComplianceTiers();
      
      console.log('🔧 DEBUG: Dashboard data loaded - Users:', users?.length || 0);
      
      // DEFENSIVE: Ensure users is always an array
      const safeUsers = Array.isArray(users) ? users : [];
      console.log('🔧 DEBUG: Safe users count:', safeUsers.length);
      
      if (!Array.isArray(users)) {
        console.error('🔥 ERROR: ComplianceTierService.getAllUsersComplianceTiers returned non-array:', users);
      }
      
      // Filter out invalid users and transform
      const validUsers = safeUsers.filter(user =>
        user &&
        typeof user === 'object' &&
        user.user_id
      );
      console.log('🔧 DEBUG: Valid users after filtering:', validUsers.length);
      
      const transformedUsers = validUsers.map(user => ({
        user_id: user.user_id,
        display_name: user.display_name || user.email || `User ${user.user_id.slice(0, 8)}`,
        email: user.email || 'No email',
        role: user.role || 'Unknown',
        tier: user.tier || 'basic',
        completion_percentage: user.completion_percentage || 0
      }));
      
      console.log('🔧 DEBUG: Transformed users:', transformedUsers.length);
      
      // FIX: Calculate statistics locally from the users data to avoid race condition
      const basicUsers = transformedUsers.filter(user => user.tier === 'basic');
      const robustUsers = transformedUsers.filter(user => user.tier === 'robust');
      
      const basicCompletionSum = basicUsers.reduce((sum, user) => sum + (user.completion_percentage || 0), 0);
      const robustCompletionSum = robustUsers.reduce((sum, user) => sum + (user.completion_percentage || 0), 0);
      
      const basicCompletionAvg = basicUsers.length > 0 ? Math.round(basicCompletionSum / basicUsers.length) : 0;
      const robustCompletionAvg = robustUsers.length > 0 ? Math.round(robustCompletionSum / robustUsers.length) : 0;
      
      const calculatedStats = {
        basic_tier_users: basicUsers.length,
        robust_tier_users: robustUsers.length,
        basic_completion_avg: basicCompletionAvg,
        robust_completion_avg: robustCompletionAvg
      };
      
      console.log('🔧 DEBUG: Calculated statistics:', calculatedStats);
      
      setStatistics(calculatedStats);
      setAllUsers(transformedUsers);
    } catch (error) {
      console.error('🔥 ERROR: Dashboard data loading failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalUsers = statistics.basic_tier_users + statistics.robust_tier_users;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active compliance users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Basic Tier</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.basic_tier_users}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={statistics.basic_completion_avg} className="h-1 flex-1" />
              <span className="text-xs text-muted-foreground">
                {statistics.basic_completion_avg}% avg
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Robust Tier</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.robust_tier_users}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={statistics.robust_completion_avg} className="h-1 flex-1" />
              <span className="text-xs text-muted-foreground">
                {statistics.robust_completion_avg}% avg
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((statistics.basic_completion_avg + statistics.robust_completion_avg) / 2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Compliance Tier Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              if (!Array.isArray(allUsers)) {
                console.error('🔥 ERROR: allUsers is not an array!', allUsers);
                return <div className="text-red-500">Error: User data is not properly loaded</div>;
              }
              
              if (allUsers.length === 0) {
                return <div className="text-muted-foreground">No compliance users found</div>;
              }
              
              return allUsers.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{user.display_name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={user.tier === 'robust' ? 'bg-green-50' : 'bg-blue-50'}
                  >
                    {user.tier === 'robust' ? (
                      <Shield className="h-3 w-3 mr-1" />
                    ) : (
                      <FileText className="h-3 w-3 mr-1" />
                    )}
                    {user.tier?.charAt(0).toUpperCase() + user.tier?.slice(1) || 'Unknown'}
                  </Badge>
                  
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={user.completion_percentage} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground">
                      {user.completion_percentage}%
                    </span>
                  </div>
                </div>
              </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}