
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  Clock, 
  BarChart3,
  ArrowRight,
  TrendingUp,
  Shield,
  UserPlus
} from 'lucide-react';

interface NavigationCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  stats?: {
    primary: number | string;
    secondary?: number | string;
    trend?: 'up' | 'down' | 'stable';
    label: string;
  };
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  action: () => void;
}

interface SupervisionNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeSupervisees: number;
  activeSupervisors: number;
  pendingRequests: number;
  complianceRate: number;
}

export const SupervisionNavigation: React.FC<SupervisionNavigationProps> = ({
  activeTab,
  onTabChange,
  activeSupervisees,
  activeSupervisors,
  pendingRequests,
  complianceRate
}) => {
  const navigationCards: NavigationCard[] = [
    {
      id: 'relationships',
      title: 'Active Relationships',
      description: 'View and manage all active supervision relationships and track progress',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      stats: {
        primary: activeSupervisees + activeSupervisors,
        secondary: `${activeSupervisees} supervisees, ${activeSupervisors} supervisors`,
        label: 'Total relationships',
        trend: 'up'
      },
      badge: (activeSupervisees + activeSupervisors) > 0 
        ? { text: 'Active', variant: 'default' as const }
        : { text: 'No Relationships', variant: 'secondary' as const },
      action: () => onTabChange('relationships')
    },
    {
      id: 'requests',
      title: 'Pending Requests',
      description: 'Review and respond to supervision requests requiring your attention',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      stats: {
        primary: pendingRequests,
        label: 'Awaiting response',
        trend: pendingRequests > 0 ? 'down' : 'stable'
      },
      badge: pendingRequests > 0 
        ? { text: 'Action Required', variant: 'secondary' as const }
        : { text: 'All Clear', variant: 'default' as const },
      action: () => onTabChange('requests')
    },
    {
      id: 'compliance',
      title: 'Compliance Tracking',
      description: 'Monitor supervision compliance, requirements, and progress indicators',
      icon: Shield,
      gradient: 'from-green-500 to-emerald-600',
      stats: {
        primary: `${complianceRate}%`,
        label: 'Compliance rate',
        trend: complianceRate >= 80 ? 'up' : 'down'
      },
      badge: complianceRate >= 80 
        ? { text: 'Compliant', variant: 'default' as const }
        : { text: 'Needs Attention', variant: 'destructive' as const },
      action: () => onTabChange('compliance')
    },
    {
      id: 'analytics',
      title: 'Supervision Analytics',
      description: 'Comprehensive analytics and reporting for supervision performance',
      icon: BarChart3,
      gradient: 'from-purple-500 to-purple-600',
      stats: {
        primary: activeSupervisees,
        label: 'People supervised',
        trend: 'stable'
      },
      badge: { text: 'Analytics', variant: 'outline' as const },
      action: () => onTabChange('analytics')
    }
  ];

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Supervision Dashboard
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigationCards.map((card) => (
            <Card 
              key={card.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-0 overflow-hidden ${
                activeTab === card.id ? 'ring-2 ring-primary shadow-lg scale-105' : ''
              }`}
              onClick={card.action}
            >
              <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${card.gradient} bg-opacity-10`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  {card.badge && (
                    <Badge variant={card.badge.variant} className="text-xs">
                      {card.badge.text}
                    </Badge>
                  )}
                </div>
                
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {card.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {card.description}
                </p>
                
                {card.stats && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {card.stats.primary}
                      </span>
                      {card.stats.secondary && (
                        <span className="text-sm text-gray-500">
                          ({card.stats.secondary})
                        </span>
                      )}
                      {getTrendIcon(card.stats.trend)}
                    </div>
                    <span className="text-xs text-gray-500">{card.stats.label}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-0 h-auto text-primary hover:text-primary/80"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
