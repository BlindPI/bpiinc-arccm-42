
import React, { useState } from 'react';
import { useCertificateAnalytics } from '@/hooks/useCertificateAnalytics';
import StatusDistributionChart from './StatusDistributionChart';
import MonthlyTrendsChart from './MonthlyTrendsChart';
import TopCoursesChart from './TopCoursesChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Download, FileSpreadsheet, Filter, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CertificateAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('6');
  const [view, setView] = useState<string>('overview');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subMonths(new Date(), 6),
    to: new Date()
  });
  
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
    toast.success('Analytics data refreshed');
  };

  const handleExport = () => {
    toast.success('Analytics data export started');
    // In a real implementation, this would trigger a CSV/Excel download
    setTimeout(() => {
      const now = new Date();
      const fileName = `certificate-analytics-${format(now, 'yyyy-MM-dd')}.csv`;
      
      toast.success(`Data exported to ${fileName}`);
    }, 1500);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const totalCertificates = totalActive + totalExpired + totalRevoked;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Analytics</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Data generated on {formatDate(generatedAt)}
            <Badge variant="outline" className="ml-2 font-normal">
              {totalCertificates.toLocaleString()} Total Certificates
            </Badge>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>Date Range</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} disabled={isLoading} size="sm" className="h-9">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={handleExport} variant="outline" size="sm" className="h-9">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Location:</span>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-40 h-9">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="hq">Headquarters</SelectItem>
                  <SelectItem value="west">West Region</SelectItem>
                  <SelectItem value="east">East Region</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Course:</span>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full md:w-40 h-9">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="first-aid">First Aid</SelectItem>
                  <SelectItem value="cpr">CPR</SelectItem>
                  <SelectItem value="emergency">Emergency Response</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input
                placeholder="Search certificates..."
                className="h-9"
              />
            </div>
          </div>
        </div>
      </div>
      
      <Tabs value={view} onValueChange={setView} className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="px-4">Overview</TabsTrigger>
            <TabsTrigger value="trends" className="px-4">Trends</TabsTrigger>
            <TabsTrigger value="locations" className="px-4">Locations</TabsTrigger>
            <TabsTrigger value="verification" className="px-4">Verification</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Certificates</CardTitle>
                <CardDescription>Currently valid certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {isLoading ? <div className="animate-pulse h-9 w-16 bg-gray-200 rounded"></div> : totalActive.toLocaleString()}
                </div>
                <p className="text-sm text-green-600 flex items-center mt-2">
                  <span className="inline-block p-1 rounded-full bg-green-100 mr-1">↑</span>
                  12% increase from previous period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expired Certificates</CardTitle>
                <CardDescription>Need renewal or replacement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {isLoading ? <div className="animate-pulse h-9 w-16 bg-gray-200 rounded"></div> : totalExpired.toLocaleString()}
                </div>
                <p className="text-sm text-orange-600 flex items-center mt-2">
                  <span className="inline-block p-1 rounded-full bg-orange-100 mr-1">↓</span>
                  5% decrease from previous period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revoked Certificates</CardTitle>
                <CardDescription>Certificates invalidated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {isLoading ? <div className="animate-pulse h-9 w-16 bg-gray-200 rounded"></div> : totalRevoked.toLocaleString()}
                </div>
                <p className="text-sm text-blue-600 flex items-center mt-2">
                  <span className="inline-block p-1 rounded-full bg-blue-100 mr-1">=</span>
                  No change from previous period
                </p>
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
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Issuance Trends</CardTitle>
              <CardDescription>Monthly certificate issuance over time</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="animate-pulse h-80 w-full bg-gray-100 rounded"></div>
              ) : (
                <div className="h-80">
                  <MonthlyTrendsChart 
                    data={monthlyTrends} 
                    isLoading={false} 
                    isError={false}
                    showFullDetail={true} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Expirations</CardTitle>
                <CardDescription>Certificates due to expire in next 90 days</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">Expiration prediction chart view coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Certificate Renewal Rate</CardTitle>
                <CardDescription>Percentage of expired certificates that get renewed</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">Renewal rate visualization coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Distribution by Location</CardTitle>
              <CardDescription>Geographic distribution of certificates</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Location-based analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Locations with most certificates issued</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">Top locations chart coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Location Performance</CardTitle>
                <CardDescription>Certificate metrics by location</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">Location performance metrics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Verification Activity</CardTitle>
              <CardDescription>History of certificate verification requests</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Verification activity chart coming soon</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Verification Success Rate</CardTitle>
                <CardDescription>Percentage of successful verifications</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">Verification success rate metrics coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Verification Attempts</CardTitle>
                <CardDescription>Latest certificate verification activities</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">Recent verification log coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CertificateAnalyticsDashboard;
