import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Users,
  Calendar,
  Download,
  Search,
  Filter,
  BarChart3,
  Target,
  CreditCard,
  Percent,
  Award,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calculator
} from 'lucide-react';
import { crmRevenueService } from '@/services/crm/crmRevenueService';

interface CommissionTrackingProps {
  salesRepId?: string;
  showFilters?: boolean;
}

export function CommissionTracking({ salesRepId, showFilters = true }: CommissionTrackingProps) {
  const [dateRange, setDateRange] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalesRep, setSelectedSalesRep] = useState(salesRepId || '');

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

  // Mock sales reps data (in real implementation, this would come from user service)
  const salesReps = [
    { id: 'rep-1', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', role: 'Senior Sales Rep' },
    { id: 'rep-2', name: 'Mike Chen', email: 'mike.chen@example.com', role: 'Sales Rep' },
    { id: 'rep-3', name: 'Emily Rodriguez', email: 'emily.rodriguez@example.com', role: 'Regional Manager' },
    { id: 'rep-4', name: 'David Kim', email: 'david.kim@example.com', role: 'Sales Rep' },
    { id: 'rep-5', name: 'Lisa Thompson', email: 'lisa.thompson@example.com', role: 'Account Manager' }
  ];

  // Fetch commission summary for selected rep
  const { data: commissionData, isLoading: commissionLoading } = useQuery({
    queryKey: ['crm', 'commission-summary', selectedSalesRep, startDate, endDate],
    queryFn: async () => {
      if (!selectedSalesRep) return null;
      const result = await crmRevenueService.getCommissionSummary(selectedSalesRep, startDate, endDate);
      return result.success ? result.data : null;
    },
    enabled: !!selectedSalesRep,
  });

  // Fetch revenue records for commission details
  const { data: revenueRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['crm', 'commission-records', selectedSalesRep, startDate, endDate],
    queryFn: async () => {
      if (!selectedSalesRep) return { data: [], total: 0 };
      const result = await crmRevenueService.getRevenueRecords({
        sales_rep_id: selectedSalesRep,
        date_from: startDate,
        date_to: endDate
      }, 1, 50);
      return result.success ? result.data : { data: [], total: 0 };
    },
    enabled: !!selectedSalesRep,
  });

  // Mock commission data for all reps (for comparison)
  const allRepsCommission = salesReps.map(rep => ({
    ...rep,
    total_commission: Math.floor(Math.random() * 15000) + 5000,
    total_sales: Math.floor(Math.random() * 150000) + 50000,
    commission_rate: Math.floor(Math.random() * 8) + 5,
    transactions: Math.floor(Math.random() * 50) + 10,
    growth: (Math.random() - 0.5) * 40 // -20% to +20%
  }));

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

  const filteredSalesReps = allRepsCommission.filter(rep =>
    rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Commission Tracking</h2>
            <p className="text-gray-600">Monitor sales performance and commission earnings</p>
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
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Sales Rep Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sales representatives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedSalesRep} onValueChange={setSelectedSalesRep}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select sales rep for details" />
              </SelectTrigger>
              <SelectContent>
                {salesReps.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id}>
                    {rep.name} - {rep.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Individual Commission Details */}
      {selectedSalesRep && commissionData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Commission</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(commissionData.total_commission)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    From {formatCurrency(commissionData.total_sales)} in sales
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Commission Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{commissionData.avg_commission_rate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Across {commissionData.transaction_count} transactions
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Percent className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(commissionData.total_sales)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {formatCurrency(commissionData.total_sales / commissionData.transaction_count)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{commissionData.transaction_count}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Commission per transaction: {formatCurrency(commissionData.total_commission / commissionData.transaction_count)}
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

      {/* Commission by Revenue Type */}
      {selectedSalesRep && commissionData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Commission Breakdown by Revenue Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(commissionData.commission_by_type).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getRevenueTypeColor(type)}>
                      {getRevenueTypeLabel(type)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(amount)}</p>
                    <p className="text-sm text-gray-600">
                      {((amount / commissionData.total_commission) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Details Table */}
      {selectedSalesRep && revenueRecords && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Commission Details
            </CardTitle>
            <CardDescription>
              Detailed breakdown of commission-earning transactions
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
                    <TableHead>Sale Amount</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Commission Earned</TableHead>
                    <TableHead>AP Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueRecords.data
                    .filter(record => record.commission_amount && record.commission_amount > 0)
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.revenue_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRevenueTypeColor(record.revenue_type)}>
                            {getRevenueTypeLabel(record.revenue_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(record.amount)}
                        </TableCell>
                        <TableCell>
                          {record.commission_rate ? `${record.commission_rate}%` : 'N/A'}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(record.commission_amount || 0)}
                        </TableCell>
                        <TableCell>
                          {record.ap_location_id ? `AP-${record.ap_location_id}` : 'Direct'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Sales Reps Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sales Team Performance
          </CardTitle>
          <CardDescription>
            Commission performance comparison across all sales representatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sales Rep</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Total Commission</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Avg Rate</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSalesReps
                .sort((a, b) => b.total_commission - a.total_commission)
                .map((rep, index) => (
                  <TableRow 
                    key={rep.id}
                    className={selectedSalesRep === rep.id ? 'bg-blue-50' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {rep.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{rep.name}</p>
                          <p className="text-sm text-gray-500">{rep.email}</p>
                        </div>
                        {index < 3 && (
                          <Award className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{rep.role}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(rep.total_commission)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(rep.total_sales)}
                    </TableCell>
                    <TableCell>{rep.commission_rate}%</TableCell>
                    <TableCell>{rep.transactions}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {rep.growth >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        <span className={rep.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatPercentage(rep.growth)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Commission Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Commission Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Top Performers</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• {filteredSalesReps[0]?.name} leads with {formatCurrency(filteredSalesReps[0]?.total_commission)} in commissions</li>
                <li>• Average commission rate across team: {(filteredSalesReps.reduce((sum, rep) => sum + rep.commission_rate, 0) / filteredSalesReps.length).toFixed(1)}%</li>
                <li>• Corporate contracts generate highest commission rates</li>
                <li>• {filteredSalesReps.filter(rep => rep.growth > 0).length} reps showing positive growth</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Optimization Opportunities</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Focus on corporate contract sales for higher commissions</li>
                <li>• Provide additional training for underperforming reps</li>
                <li>• Consider incentive programs for AP setup fees</li>
                <li>• Review commission structure for recurring revenue</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}