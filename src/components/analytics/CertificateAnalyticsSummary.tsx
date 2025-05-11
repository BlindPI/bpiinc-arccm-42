
import React from 'react';
import { useCertificateAnalytics } from '@/hooks/useCertificateAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusDistributionChart from './StatusDistributionChart';

interface CertificateAnalyticsSummaryProps {
  compact?: boolean;
}

const CertificateAnalyticsSummary: React.FC<CertificateAnalyticsSummaryProps> = ({ compact = false }) => {
  // Use limited data for the summary view
  const { 
    statusCounts, 
    totalActive,
    totalExpired,
    totalRevoked,
    isLoading
  } = useCertificateAnalytics({
    monthsForTrends: 3,
    topCoursesLimit: 3,
    enabled: true
  });

  // Style classes based on compact mode
  const gridClass = compact 
    ? "grid grid-cols-1 sm:grid-cols-3 gap-3" 
    : "grid gap-4 md:grid-cols-3";
  
  const cardClass = compact 
    ? "shadow-sm" 
    : "shadow-md";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold">Certificate Analytics</h3>
          <p className="text-sm text-muted-foreground">Key metrics overview</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link to="/certificate-analytics">
            Full Dashboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className={gridClass}>
        <Card className={cardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {isLoading ? <div className="animate-pulse h-7 w-16 bg-gray-200 rounded"></div> : totalActive.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className={cardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoading ? <div className="animate-pulse h-7 w-16 bg-gray-200 rounded"></div> : totalExpired.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className={cardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revoked Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? <div className="animate-pulse h-7 w-16 bg-gray-200 rounded"></div> : totalRevoked.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={`${compact ? 'h-64' : 'h-80'} overflow-hidden`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
            <BarChart className="mr-2 h-4 w-4" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 h-full">
          <StatusDistributionChart 
            data={statusCounts} 
            isLoading={isLoading} 
            isError={false} 
            compact={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateAnalyticsSummary;
