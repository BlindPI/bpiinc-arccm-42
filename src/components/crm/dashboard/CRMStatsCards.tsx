
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, DollarSign, TrendingUp, Building, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EnhancedCRMService } from '@/services/crm/enhancedCRMService';

export function CRMStatsCards() {
  const { data: stats } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => EnhancedCRMService.getCRMStats()
  });

  const statCards = [
    {
      title: 'Total Leads',
      value: stats?.total_leads || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Contacts',
      value: stats?.totalContacts || 0,
      icon: Phone,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Open Opportunities',
      value: stats?.total_opportunities || 0,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Pipeline Value',
      value: `$${((stats?.total_opportunities || 0) * (stats?.average_deal_size || 0)).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Conversion Rate',
      value: `${(stats?.conversion_rate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Win Rate',
      value: `${(stats?.win_rate || 0).toFixed(1)}%`,
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
