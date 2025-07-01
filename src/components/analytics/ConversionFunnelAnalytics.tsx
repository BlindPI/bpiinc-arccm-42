
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, Users, Award, BookOpen, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
  icon: React.ComponentType<any>;
}

interface ConversionMetrics {
  totalUsers: number;
  certificateRequests: number;
  approvedRequests: number;
  generatedCertificates: number;
  activeCertificates: number;
}

export function ConversionFunnelAnalytics() {
  const [timeRange, setTimeRange] = useState('30');
  const [funnelType, setFunnelType] = useState('certificate');

  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['conversion-funnel', funnelType, timeRange],
    queryFn: async (): Promise<FunnelStage[]> => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      if (funnelType === 'certificate') {
        // Get conversion metrics for certificate process
        const [usersResult, requestsResult, certificatesResult] = await Promise.all([
          supabase.from('profiles').select('id').gte('created_at', startDate.toISOString()),
          supabase.from('certificate_requests').select('id, status').gte('created_at', startDate.toISOString()),
          supabase.from('certificates').select('id, status').gte('created_at', startDate.toISOString())
        ]);

        const totalUsers = usersResult.data?.length || 0;
        const totalRequests = requestsResult.data?.length || 0;
        const approvedRequests = requestsResult.data?.filter(r => r.status === 'APPROVED').length || 0;
        const generatedCerts = certificatesResult.data?.length || 0;
        const activeCerts = certificatesResult.data?.filter(c => c.status === 'ACTIVE').length || 0;

        const stages: FunnelStage[] = [
          {
            name: 'Total Users',
            count: totalUsers,
            percentage: 100,
            dropoff: 0,
            icon: Users
          },
          {
            name: 'Certificate Requests',
            count: totalRequests,
            percentage: totalUsers > 0 ? (totalRequests / totalUsers) * 100 : 0,
            dropoff: totalUsers - totalRequests,
            icon: BookOpen
          },
          {
            name: 'Approved Requests',
            count: approvedRequests,
            percentage: totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0,
            dropoff: totalRequests - approvedRequests,
            icon: CheckCircle
          },
          {
            name: 'Generated Certificates',
            count: generatedCerts,
            percentage: approvedRequests > 0 ? (generatedCerts / approvedRequests) * 100 : 0,
            dropoff: approvedRequests - generatedCerts,
            icon: Award
          },
          {
            name: 'Active Certificates',
            count: activeCerts,
            percentage: generatedCerts > 0 ? (activeCerts / generatedCerts) * 100 : 0,
            dropoff: generatedCerts - activeCerts,
            icon: Award
          }
        ];

        return stages;
      }

      // Default empty funnel
      return [];
    }
  });

  const { data: conversionRates } = useQuery({
    queryKey: ['conversion-rates', timeRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      const [
        { data: users },
        { data: requests },
        { data: certificates }
      ] = await Promise.all([
        supabase.from('profiles').select('id').gte('created_at', startDate.toISOString()),
        supabase.from('certificate_requests').select('id, status').gte('created_at', startDate.toISOString()),
        supabase.from('certificates').select('id, status').gte('created_at', startDate.toISOString())
      ]);

      const totalUsers = users?.length || 0;
      const totalRequests = requests?.length || 0;
      const activeCerts = certificates?.filter(c => c.status === 'ACTIVE').length || 0;

      return {
        userToRequest: totalUsers > 0 ? ((totalRequests / totalUsers) * 100).toFixed(1) : '0',
        requestToCertificate: totalRequests > 0 ? ((activeCerts / totalRequests) * 100).toFixed(1) : '0',
        overallConversion: totalUsers > 0 ? ((activeCerts / totalUsers) * 100).toFixed(1) : '0'
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Conversion Funnel Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={funnelType} onValueChange={setFunnelType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificate">Certificate Process</SelectItem>
                  <SelectItem value="course">Course Completion</SelectItem>
                  <SelectItem value="user">User Journey</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Conversion Metrics */}
            {conversionRates && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {conversionRates.userToRequest}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        User to Request Rate
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {conversionRates.requestToCertificate}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Request to Certificate Rate
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {conversionRates.overallConversion}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Overall Conversion Rate
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Funnel Visualization */}
            <div className="space-y-4">
              {funnelData?.map((stage, index) => {
                const IconComponent = stage.icon;
                const isFirstStage = index === 0;
                const width = Math.max(stage.percentage, 10); // Minimum width for visibility
                
                return (
                  <div key={stage.name} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 w-48">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{stage.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {stage.count.toLocaleString()} users
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="relative">
                          <div 
                            className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-medium transition-all duration-500"
                            style={{ width: `${width}%` }}
                          >
                            {stage.percentage.toFixed(1)}%
                          </div>
                          {!isFirstStage && stage.dropoff > 0 && (
                            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                              <Badge variant="destructive" className="text-xs">
                                -{stage.dropoff}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <Progress 
                          value={stage.percentage} 
                          className="mt-2 h-2"
                        />
                      </div>
                    </div>
                    
                    {index < (funnelData?.length || 0) - 1 && (
                      <div className="flex justify-center my-2">
                        <div className="w-px h-4 bg-gray-300"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Insights */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-2">Key Insights</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  {funnelData && funnelData.length > 1 && (
                    <>
                      <p>
                        • Biggest drop-off occurs at: {
                          funnelData.reduce((max, stage, index) => 
                            index > 0 && stage.dropoff > funnelData[max].dropoff ? index : max, 1
                          ) > 0 ? funnelData[funnelData.reduce((max, stage, index) => 
                            index > 0 && stage.dropoff > funnelData[max].dropoff ? index : max, 1
                          )].name : 'N/A'
                        }
                      </p>
                      <p>
                        • Best performing stage: {
                          funnelData.length > 1 ? 
                          funnelData.slice(1).reduce((best, stage) => 
                            stage.percentage > best.percentage ? stage : best
                          ).name : 'N/A'
                        }
                      </p>
                      <p>
                        • Overall completion rate: {funnelData[funnelData.length - 1]?.percentage.toFixed(1)}%
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
