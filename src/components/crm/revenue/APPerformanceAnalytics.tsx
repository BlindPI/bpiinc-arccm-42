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
  Building,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Download,
  Search,
  Filter,
  BarChart3,
  Target,
  MapPin,
  Award,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  DollarSign,
  Certificate,
  Activity,
  Star
} from 'lucide-react';
import { crmRevenueService } from '@/services/crm/crmRevenueService';

interface APPerformanceAnalyticsProps {
  apLocationId?: number;
  showFilters?: boolean;
}

export function APPerformanceAnalytics({ apLocationId, showFilters = true }: APPerformanceAnalyticsProps) {
  const [dateRange, setDateRange] = useState('90');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('revenue');

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

  // Fetch AP performance data
  const { data: apPerformanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['crm', 'ap-performance', startDate, endDate],
    queryFn: async () => {
      const result = await crmRevenueService.getRevenueByAP(startDate, endDate);
      return result.success ? result.data : [];
    },
  });

  // Mock additional AP data (in real implementation, this would come from AP service)
  const mockAPDetails = [
    {
      ap_location_id: 1001,
      business_name: 'Metro Safety Training',
      contact_name: 'John Smith',
      city: 'Toronto',
      province: 'ON',
      status: 'active',
      setup_date: '2023-01-15',
      rating: 4.8,
      specializations: ['First Aid', 'CPR', 'AED'],
      last_activity: '2024-01-20'
    },
    {
      ap_location_id: 1002,
      business_name: 'Pacific Coast Training',
      contact_name: 'Sarah Johnson',
      city: 'Vancouver',
      province: 'BC',
      status: 'active',
      setup_date: '2023-03-22',
      rating: 4.6,
      specializations: ['First Aid', 'CPR', 'Wilderness First Aid'],
      last_activity: '2024-01-18'
    },
    {
      ap_location_id: 1003,
      business_name: 'Prairie Safety Solutions',
      contact_name: 'Mike Wilson',
      city: 'Calgary',
      province: 'AB',
      status: 'active',
      setup_date: '2023-02-10',
      rating: 4.9,
      specializations: ['First Aid', 'CPR', 'Industrial Safety'],
      last_activity: '2024-01-19'
    },
    {
      ap_location_id: 1004,
      business_name: 'Atlantic Training Center',
      contact_name: 'Emma Davis',
      city: 'Halifax',
      province: 'NS',
      status: 'active',
      setup_date: '2023-04-05',
      rating: 4.7,
      specializations: ['First Aid', 'CPR', 'Marine Safety'],
      last_activity: '2024-01-17'
    },
    {
      ap_location_id: 1005,
      business_name: 'Northern Skills Training',
      contact_name: 'David Chen',
      city: 'Winnipeg',
      province: 'MB',
      status: 'active',
      setup_date: '2023-05-12',
      rating: 4.5,
      specializations: ['First Aid', 'CPR'],
      last_activity: '2024-01-16'
    }
  ];

  // Combine performance data with AP details
  const enrichedAPData = apPerformanceData?.map(performance => {
    const details = mockAPDetails.find(ap => ap.ap_location_id === performance.ap_location_id);
    return {
      ...performance,
      ...details,
      avg_per_certificate: performance.certificate_count > 0 ? performance.total_revenue / performance.certificate_count : 0,
      avg_per_participant: performance.participant_count > 0 ? performance.total_revenue / performance.participant_count : 0,
      efficiency_score: (performance.total_revenue / 1000) + (performance.certificate_count * 2) + (performance.participant_count * 0.5)
    };
  }) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // Filter and sort data
  const filteredData = enrichedAPData
    .filter(ap => 
      ap.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ap.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ap.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.total_revenue - a.total_revenue;
        case 'certificates':
          return b.certificate_count - a.certificate_count;
        case 'participants':
          return b.participant_count - a.participant_count;
        case 'efficiency':
          return b.efficiency_score - a.efficiency_score;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return b.total_revenue - a.total_revenue;
      }
    });

  // Calculate summary metrics
  const totalRevenue = enrichedAPData.reduce((sum, ap) => sum + ap.total_revenue, 0);
  const totalCertificates = enrichedAPData.reduce((sum, ap) => sum + ap.certificate_count, 0);
  const totalParticipants = enrichedAPData.reduce((sum, ap) => sum + ap.participant_count, 0);
  const avgRating = enrichedAPData.reduce((sum, ap) => sum + (ap.rating || 0), 0) / enrichedAPData.length;

  if (performanceLoading) {
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
            <h2 className="text-2xl font-bold text-gray-900">AP Performance Analytics</h2>
            <p className="text-gray-600">Monitor Authorized Provider performance and revenue generation</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
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

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total AP Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  From {enrichedAPData.length} active APs
                </p>
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
                <p className="text-sm font-medium text-gray-600">Certificates Issued</p>
                <p className="text-2xl font-bold text-gray-900">{totalCertificates.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {formatCurrency(totalRevenue / totalCertificates)} per cert
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Certificate className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">{totalParticipants.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {formatCurrency(totalRevenue / totalParticipants)} per participant
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                <div className="flex items-center mt-1">
                  {getRatingStars(avgRating)}
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search APs by name, contact, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Sort by Revenue</SelectItem>
                <SelectItem value="certificates">Sort by Certificates</SelectItem>
                <SelectItem value="participants">Sort by Participants</SelectItem>
                <SelectItem value="efficiency">Sort by Efficiency</SelectItem>
                <SelectItem value="rating">Sort by Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredData.slice(0, 3).map((ap, index) => (
          <Card key={ap.ap_location_id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                  {index === 1 && <Award className="h-5 w-5 text-gray-400" />}
                  {index === 2 && <Award className="h-5 w-5 text-orange-600" />}
                  <div>
                    <CardTitle className="text-lg">{ap.business_name}</CardTitle>
                    <p className="text-sm text-gray-600">{ap.contact_name}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(ap.status || 'active')}>
                  {ap.status || 'active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{ap.city}, {ap.province}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {getRatingStars(ap.rating || 0)}
                <span className="text-sm text-gray-600">({ap.rating || 0})</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(ap.total_revenue)}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{ap.certificate_count}</p>
                  <p className="text-xs text-gray-500">Certificates</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {ap.specializations?.slice(0, 3).map((spec) => (
                  <Badge key={spec} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed AP Performance
          </CardTitle>
          <CardDescription>
            Comprehensive performance metrics for all Authorized Providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AP Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Certificates</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Avg/Cert</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((ap, index) => (
                <TableRow key={ap.ap_location_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{ap.business_name}</p>
                        <p className="text-sm text-gray-500">{ap.contact_name}</p>
                        <p className="text-xs text-gray-400">AP-{ap.ap_location_id}</p>
                      </div>
                      {index < 3 && (
                        <Award className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">{ap.city}, {ap.province}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-green-600">
                    {formatCurrency(ap.total_revenue)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {ap.certificate_count}
                  </TableCell>
                  <TableCell>
                    {ap.participant_count}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(ap.avg_per_certificate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getRatingStars(ap.rating || 0)}
                      <span className="text-sm ml-1">({ap.rating || 0})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ap.status || 'active')}>
                      {ap.status || 'active'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Top Performers</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• {filteredData[0]?.business_name} leads with {formatCurrency(filteredData[0]?.total_revenue)} in revenue</li>
                <li>• Average revenue per AP: {formatCurrency(totalRevenue / enrichedAPData.length)}</li>
                <li>• Top-rated AP: {filteredData.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]?.business_name} ({filteredData.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]?.rating}/5)</li>
                <li>• Most certificates issued: {filteredData.sort((a, b) => b.certificate_count - a.certificate_count)[0]?.business_name} ({filteredData.sort((a, b) => b.certificate_count - a.certificate_count)[0]?.certificate_count})</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Growth Opportunities</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Focus on supporting lower-performing APs with training</li>
                <li>• Encourage specialization in high-demand areas</li>
                <li>• Implement performance-based incentive programs</li>
                <li>• Regular check-ins with APs showing declining activity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}