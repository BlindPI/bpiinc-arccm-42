import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  CreditCard,
  Receipt,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw
} from 'lucide-react';
import { crmRevenueService } from '@/services/crm/crmRevenueService';
import type { RevenueMetrics, CRMRevenueRecord } from '@/types/crm';

interface RevenueDashboardProps {
  salesRepId?: string;
  showFilters?: boolean;
}

export function RevenueDashboard({ salesRepId, showFilters = true }: RevenueDashboardProps) {
  const [dateRange, setDateRange] = useState('30');
  const [revenueType, setRevenueType] = useState<string>('all');

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch revenue metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['crm', 'revenue-metrics', startDate, endDate, salesRepId],
    queryFn: async () => {
      const result = await crmRevenueService.getRevenueMetrics(startDate, endDate, salesRepId);
      return result.success ? result.data : null;
    },
  });

  // Fetch monthly trend
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['crm', 'revenue-trend', salesRepId],
    queryFn: async () => {
      const result = await crmRevenueService.getMonthlyRevenueTrend(12, salesRepId);
      return result.success ? result.data : [];
    },
  });

  // Fetch recent revenue records
  const { data: recentRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['crm', 'revenue-records', revenueType, startDate, endDate, salesRepId],
    queryFn: async () => {
      const filters: any = {
        date_from: startDate,
        date_to: endDate
      };
      
      if (revenueType !== 'all') {
        filters.revenue_type = revenueType;
      }
      
      if (salesRepId) {
        filters.sales_rep_id = salesRepId;
      }

      const result = await crmRevenueService.getRevenueRecords(filters, 1, 20);
      return result.success ? result.data : { data: [], total: 0 };
    },
  });

  // Fetch AP performance data
  const { data: apPerformance, isLoading: apLoading } = useQuery({
    queryKey: ['crm', 'revenue-by-ap', startDate, endDate],
    queryFn: async () => {
      const result = await crmRevenueService.getRevenueByAP(startDate, endDate);
      return result.success ? result.data : [];
    },
    enabled: !salesRepId, // Only fetch for overall dashboard
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getRevenueTypeColor = (type: string) => {
    const colors = {
      certificate_sale: 'bg-blue-100 text-blue-800',
      corporate_contract: 'bg-green-100 text-green-800',
      ap_setup_fee: 'bg-purple-100 text-purple-800',
      recurring_revenue: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRevenueTypeLabel = (type: string) => {
    const labels = {
      certificate_sale: 'Certificate Sale',
      corporate_contract: 'Corporate Contract',
      ap_setup_fee: 'AP Setup Fee',
      recurring_revenue: 'Recurring Revenue'
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Calculate growth percentage (mock calculation for demo)
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Mock previous period data for growth calculation
  const previousPeriodRevenue = metricsData ? metricsData.total_revenue * 0.85 : 0;
  const revenueGrowth = metricsData ? calculateGrowth(metricsData.total_revenue, previousPeriodRevenue) : 0;

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h2>
            <p className="text-gray-600">Track revenue performance and trends</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={revenueType} onValueChange={setRevenueType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Revenue Types</SelectItem>
                <SelectItem value="certificate_sale">Certificate Sales</SelectItem>
                <SelectItem value="corporate_contract">Corporate Contracts</SelectItem>
                <SelectItem value="ap_setup_fee">AP Setup Fees</SelectItem>
                <SelectItem value="recurring_revenue">Recurring Revenue</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {metricsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metricsData.total_revenue)}</p>
                  <div className="flex items-center mt-1">
                    {revenueGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(revenueGrowth)} vs previous period
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Certificate Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metricsData.certificate_revenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((metricsData.certificate_revenue / metricsData.total_revenue) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Corporate Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metricsData.corporate_revenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((metricsData.corporate_revenue / metricsData.total_revenue) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{metricsData.transaction_count}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {formatCurrency(metricsData.total_revenue / metricsData.transaction_count)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Monthly Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {trendData?.slice(-6).map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(month.month + '-01').toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}</p>
                      <p className="text-sm text-gray-600">{month.transaction_count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(month.total_revenue)}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-600">Cert: {formatCurrency(month.certificate_revenue)}</span>
                        <span className="text-green-600">Corp: {formatCurrency(month.corporate_revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium">Certificate Sales</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(metricsData.certificate_revenue)}</p>
                    <p className="text-sm text-gray-600">
                      {((metricsData.certificate_revenue / metricsData.total_revenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="font-medium">Corporate Contracts</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(metricsData.corporate_revenue)}</p>
                    <p className="text-sm text-gray-600">
                      {((metricsData.corporate_revenue / metricsData.total_revenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="font-medium">AP Setup Fees</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(metricsData.ap_setup_revenue)}</p>
                    <p className="text-sm text-gray-600">
                      {((metricsData.ap_setup_revenue / metricsData.total_revenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AP Performance (if not filtered by sales rep) */}
      {!salesRepId && apPerformance && apPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Top Performing APs
            </CardTitle>
            <CardDescription>
              Revenue performance by Authorized Provider location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>AP Location ID</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Certificates</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Avg per Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apPerformance.slice(0, 10).map((ap) => (
                  <TableRow key={ap.ap_location_id}>
                    <TableCell className="font-medium">AP-{ap.ap_location_id}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(ap.total_revenue)}
                    </TableCell>
                    <TableCell>{ap.certificate_count}</TableCell>
                    <TableCell>{ap.participant_count}</TableCell>
                    <TableCell>{ap.transaction_count}</TableCell>
                    <TableCell>
                      {formatCurrency(ap.total_revenue / ap.transaction_count)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Revenue Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Revenue Records
          </CardTitle>
          <CardDescription>
            Latest revenue transactions in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>AP Location</TableHead>
                  <TableHead>Certificates</TableHead>
                  <TableHead>Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRecords?.data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.revenue_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRevenueTypeColor(record.revenue_type)}>
                        {getRevenueTypeLabel(record.revenue_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(record.amount)}
                    </TableCell>
                    <TableCell>
                      {record.ap_location_id ? `AP-${record.ap_location_id}` : 'N/A'}
                    </TableCell>
                    <TableCell>{record.certificate_count || 'N/A'}</TableCell>
                    <TableCell className="text-green-600">
                      {record.commission_amount ? formatCurrency(record.commission_amount) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}