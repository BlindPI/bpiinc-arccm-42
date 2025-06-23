
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  XCircle
} from 'lucide-react';
import { Certificate } from '@/types/certificates';

interface CertificateStatsCardsProps {
  certificates?: Certificate[]; // Keep for backward compatibility
  totalCounts?: {
    total: number;
    active: number;
    expired: number;
    revoked: number;
    emailed: number;
    emailRate: number;
  };
}

export const CertificateStatsCards: React.FC<CertificateStatsCardsProps> = ({
  certificates = [],
  totalCounts
}) => {
  const stats = React.useMemo(() => {
    // **FIXED: Use totalCounts if provided (for accurate totals), otherwise fall back to certificates array**
    if (totalCounts) {
      return totalCounts;
    }
    
    // Fallback to calculating from certificates array (for backward compatibility)
    const total = certificates.length;
    const active = certificates.filter(c => c.status === 'ACTIVE').length;
    const expired = certificates.filter(c => c.status === 'EXPIRED').length;
    const revoked = certificates.filter(c => c.status === 'REVOKED').length;
    const emailed = certificates.filter(c => c.email_status === 'SENT' || c.is_batch_emailed).length;
    
    return {
      total,
      active,
      expired,
      revoked,
      emailed,
      emailRate: total > 0 ? Math.round((emailed / total) * 100) : 0
    };
  }, [certificates, totalCounts]);

  const statsCards = [
    {
      title: 'Total Certificates',
      value: stats.total,
      icon: Award,
      description: 'All issued certificates',
      color: 'blue',
      trend: '+12% from last month'
    },
    {
      title: 'Active Certificates',
      value: stats.active,
      icon: CheckCircle,
      description: 'Currently valid certificates',
      color: 'green',
      trend: '+8% from last month'
    },
    {
      title: 'Email Delivery Rate',
      value: `${stats.emailRate}%`,
      icon: TrendingUp,
      description: 'Certificates successfully emailed',
      color: stats.emailRate > 90 ? 'green' : stats.emailRate > 70 ? 'amber' : 'red',
      trend: stats.emailRate > 90 ? 'Excellent' : 'Needs attention'
    },
    {
      title: 'Expired/Revoked',
      value: stats.expired + stats.revoked,
      icon: stats.revoked > 0 ? XCircle : Clock,
      description: 'Certificates needing attention',
      color: stats.expired + stats.revoked > 10 ? 'red' : 'gray',
      trend: stats.revoked > 0 ? `${stats.revoked} revoked` : 'Normal expiration'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: { icon: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      green: { icon: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      amber: { icon: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
      red: { icon: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
      gray: { icon: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {statsCards.map((stat, index) => {
        const colors = getColorClasses(stat.color);
        
        return (
          <Card key={index} className={`border-2 ${colors.border} hover:shadow-md transition-all duration-200`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <stat.icon className={`h-4 w-4 ${colors.icon}`} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
                
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {stat.trend}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
