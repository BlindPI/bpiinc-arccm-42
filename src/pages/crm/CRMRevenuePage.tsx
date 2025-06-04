import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign,
  TrendingUp,
  Users,
  Building,
  BarChart3,
  Target,
  Award,
  Calculator,
  Download,
  RefreshCw
} from 'lucide-react';
import { RevenueDashboard } from '@/components/crm/revenue/RevenueDashboard';
import { CommissionTracking } from '@/components/crm/revenue/CommissionTracking';
import { APPerformanceAnalytics } from '@/components/crm/revenue/APPerformanceAnalytics';
import { CRMLayout } from '@/components/crm/layout/CRMLayout';

export function CRMRevenuePage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock summary data (in real implementation, this would come from the revenue service)
  const summaryStats = {
    totalRevenue: 487650,
    monthlyGrowth: 12.5,
    totalCommissions: 48765,
    activeAPs: 23,
    avgRevenuePerAP: 21202,
    topPerformer: 'Metro Safety Training'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revenue Tracking</h1>
            <p className="text-gray-600">Monitor revenue performance, commissions, and AP analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalRevenue)}</p>
                  <p className="text-xs text-green-600 mt-1">{formatPercentage(summaryStats.monthlyGrowth)} this month</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalCommissions)}</p>
                  <p className="text-xs text-gray-500 mt-1">10% of total revenue</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active APs</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.activeAPs}</p>
                  <p className="text-xs text-gray-500 mt-1">Avg: {formatCurrency(summaryStats.avgRevenuePerAP)}</p>
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
                  <p className="text-sm font-medium text-gray-600">Top Performer</p>
                  <p className="text-lg font-bold text-gray-900">{summaryStats.topPerformer}</p>
                  <p className="text-xs text-gray-500 mt-1">Leading AP this month</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Revenue Dashboard
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Commission Tracking
            </TabsTrigger>
            <TabsTrigger value="ap-performance" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              AP Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <RevenueDashboard showFilters={true} />
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <CommissionTracking showFilters={true} />
          </TabsContent>

          <TabsContent value="ap-performance" className="space-y-6">
            <APPerformanceAnalytics showFilters={true} />
          </TabsContent>
        </Tabs>

        {/* Revenue Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Insights & Recommendations
            </CardTitle>
            <CardDescription>
              Key insights and actionable recommendations to optimize revenue performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Revenue Optimization
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Corporate contracts show highest profit margins</li>
                  <li>• Focus on expanding corporate training programs</li>
                  <li>• Consider volume discounts for large organizations</li>
                  <li>• Implement upselling strategies for existing clients</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  Commission Strategy
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Top performers exceed targets by 25%</li>
                  <li>• Consider tiered commission structure</li>
                  <li>• Provide additional training for underperformers</li>
                  <li>• Implement team-based incentives</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-purple-600" />
                  AP Development
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Support lower-performing APs with resources</li>
                  <li>• Encourage specialization in niche areas</li>
                  <li>• Regular performance reviews and feedback</li>
                  <li>• Consider geographic expansion opportunities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks for revenue management and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="font-medium">View Revenue Trends</span>
                <span className="text-xs text-gray-500">Analyze revenue patterns</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('commissions')}
              >
                <Calculator className="h-6 w-6" />
                <span className="font-medium">Track Commissions</span>
                <span className="text-xs text-gray-500">Monitor sales performance</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('ap-performance')}
              >
                <Building className="h-6 w-6" />
                <span className="font-medium">AP Analytics</span>
                <span className="text-xs text-gray-500">Review AP performance</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Download className="h-6 w-6" />
                <span className="font-medium">Generate Reports</span>
                <span className="text-xs text-gray-500">Export revenue data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}