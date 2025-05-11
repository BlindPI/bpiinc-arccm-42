
import React, { useState } from 'react';
import { useCertificateAnalytics } from '@/hooks/useCertificateAnalytics';
import StatusDistributionChart from './StatusDistributionChart';
import MonthlyTrendsChart from './MonthlyTrendsChart';
import TopCoursesChart from './TopCoursesChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, BarChart, AlertCircle, Download, Calendar } from 'lucide-react';
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

  if (isError) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Card className="w-full max-w-2xl border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Analytics
            </CardTitle>
            <CardDescription>There was a problem retrieving the analytics data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">This could be due to a temporary issue or a problem with the database connection.</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            Certificate Analytics
            <Badge variant="success" className="ml-3">Admin Dashboard</Badge>
          </h1>
          <div className="flex items-center mt-2 text-muted-foreground gap-2">
            <Calendar className="h-4 w-4" />
            <p className="text-sm">
              Data as of {formatDate(generatedAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="secondary" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md border-l-4 border-l-purple-500 transition-all duration-200 hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {isLoading ? <div className="animate-pulse h-9 w-16 bg-gray-200 rounded"></div> : totalActive.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently valid certificates</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-l-4 border-l-orange-500 transition-all duration-200 hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {isLoading ? <div className="animate-pulse h-9 w-16 bg-gray-200 rounded"></div> : totalExpired.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Past validity period</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-l-4 border-l-blue-500 transition-all duration-200 hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revoked Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {isLoading ? <div className="animate-pulse h-9 w-16 bg-gray-200 rounded"></div> : totalRevoked.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Manually invalidated</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md transition-all duration-200 hover:shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-lg font-semibold">
                <BarChart className="mr-2 h-5 w-5 text-primary" />
                Status Distribution
              </CardTitle>
              <CardDescription>Current certificate status breakdown</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <StatusDistributionChart 
              data={statusCounts} 
              isLoading={isLoading} 
              isError={isError} 
            />
          </CardContent>
        </Card>
        
        <Card className="shadow-md transition-all duration-200 hover:shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-lg font-semibold">
                <BarChart className="mr-2 h-5 w-5 text-primary" />
                Monthly Trends
              </CardTitle>
              <CardDescription>Certificate issuance over time</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <MonthlyTrendsChart 
              data={monthlyTrends} 
              isLoading={isLoading} 
              isError={isError} 
            />
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-md transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg font-semibold">
            <BarChart className="mr-2 h-5 w-5 text-primary" />
            Top Certification Courses
          </CardTitle>
          <CardDescription>Most popular certificate courses</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <TopCoursesChart 
            data={topCourses} 
            isLoading={isLoading} 
            isError={isError} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateAnalyticsDashboard;
