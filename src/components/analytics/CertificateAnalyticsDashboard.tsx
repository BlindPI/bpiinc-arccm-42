
import React, { useState } from 'react';
import { useCertificateAnalytics } from '@/hooks/useCertificateAnalytics';
import StatusDistributionChart from './StatusDistributionChart';
import MonthlyTrendsChart from './MonthlyTrendsChart';
import TopCoursesChart from './TopCoursesChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const CertificateAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('6');
  
  const { 
    statusCounts, 
    monthlyTrends, 
    topCourses, 
    totalActive,
    totalExpired,
    totalRevoked,
    generatedAt,
    isLoading, 
    isError,
    refetch 
  } = useCertificateAnalytics({
    monthsForTrends: parseInt(timeRange),
    topCoursesLimit: 5,
    daysForTopCourses: 365,
  });

  const handleRefresh = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Data generated on {formatDate(generatedAt)}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {isLoading ? <div className="animate-pulse h-9 w-16 bg-gray-200 rounded"></div> : totalActive.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {isLoading ? <div className="animate-pulse h-9 w-16 bg-gray-200 rounded"></div> : totalExpired.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revoked Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {isLoading ? <div className="animate-pulse h-9 w-16 bg-gray-200 rounded"></div> : totalRevoked.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusDistributionChart 
          data={statusCounts} 
          isLoading={isLoading} 
          isError={isError} 
        />
        
        <MonthlyTrendsChart 
          data={monthlyTrends} 
          isLoading={isLoading} 
          isError={isError} 
        />
      </div>
      
      <TopCoursesChart 
        data={topCourses} 
        isLoading={isLoading} 
        isError={isError} 
      />
    </div>
  );
};

export default CertificateAnalyticsDashboard;
