import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCRMTopPerformingAPs } from '@/hooks/crm/useCRMDashboard';
import {
  Building2,
  TrendingUp,
  Award,
  MapPin,
  DollarSign
} from 'lucide-react';

export const TopPerformingAPs: React.FC = () => {
  const { data: topAPs, isLoading, error } = useCRMTopPerformingAPs(10);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Authorized Providers</CardTitle>
          <CardDescription>Highest revenue generating AP locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Authorized Providers</CardTitle>
          <CardDescription>Highest revenue generating AP locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Failed to load AP performance data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Authorized Providers</CardTitle>
        <CardDescription>Highest revenue generating AP locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topAPs && topAPs.length > 0 ? (
            topAPs.map((ap, index) => {
              const isTopPerformer = index < 3;
              const maxRevenue = topAPs[0]?.revenue_generated || 1;
              const revenuePercentage = (ap.revenue_generated / maxRevenue) * 100;
              
              return (
                <div key={ap.ap_id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isTopPerformer ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {isTopPerformer ? (
                        <Award className="h-5 w-5" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground">
                          {ap.ap_name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {ap.location}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium">
                          {formatCurrency(ap.revenue_generated)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ap.certificates_issued} certificates
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Revenue Performance</span>
                        <span>{revenuePercentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={revenuePercentage} className="h-1" />
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{ap.referrals_received} referrals</span>
                        <span>{ap.conversion_rate.toFixed(1)}% conversion</span>
                      </div>
                      
                      {isTopPerformer && (
                        <Badge variant="default" className="text-xs">
                          Top {index + 1}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No AP performance data available</p>
              <p className="text-xs mt-1">Data will appear as APs generate revenue</p>
            </div>
          )}
        </div>
        
        {topAPs && topAPs.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">
                  {topAPs.reduce((sum, ap) => sum + ap.certificates_issued, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Certificates</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(topAPs.reduce((sum, ap) => sum + ap.revenue_generated, 0))}
                </div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">
                  {topAPs.reduce((sum, ap) => sum + ap.referrals_received, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Referrals</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};