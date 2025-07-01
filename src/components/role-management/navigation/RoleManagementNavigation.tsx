
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  TrendingUp, 
  FileText, 
  Clock,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Settings
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

interface RoleManagementNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentRole: string;
  pendingRequests: number;
  completedDocuments: number;
  progressPercentage: number;
}

export const RoleManagementNavigation: React.FC<RoleManagementNavigationProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  pendingRequests,
  completedDocuments,
  progressPercentage
}) => {
  const navigationCards: NavigationCard[] = [
    {
      id: 'progress',
      title: 'Progress Tracker',
      description: 'Monitor your advancement requirements, completed milestones, and next steps',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-blue-600',
      stats: {
        primary: `${progressPercentage}%`,
        label: 'Progress to next role',
        trend: 'up'
      },
      badge: progressPercentage >= 80 
        ? { text: 'Nearly Complete', variant: 'default' as const }
        : { text: 'In Progress', variant: 'secondary' as const },
      action: () => onTabChange('progress')
    },
    {
      id: 'documents',
      title: 'Document Management',
      description: 'Upload certificates, audit forms, and manage your professional documentation',
      icon: FileText,
      gradient: 'from-green-500 to-emerald-600',
      stats: {
        primary: completedDocuments,
        label: 'Documents uploaded',
        trend: 'up'
      },
      badge: completedDocuments > 0 
        ? { text: 'Documents Ready', variant: 'default' as const }
        : { text: 'Upload Required', variant: 'secondary' as const },
      action: () => onTabChange('documents')
    },
    {
      id: 'history',
      title: 'Transition History',
      description: 'View your role progression history, approvals, and performance evaluations',
      icon: Shield,
      gradient: 'from-purple-500 to-purple-600',
      stats: {
        primary: currentRole,
        label: 'Current role',
        trend: 'stable'
      },
      badge: { text: 'Active', variant: 'default' as const },
      action: () => onTabChange('history')
    },
    {
      id: 'analytics',
      title: 'Performance Analytics',
      description: 'Comprehensive analysis of your role performance and advancement metrics',
      icon: BarChart3,
      gradient: 'from-amber-500 to-orange-600',
      stats: {
        primary: pendingRequests,
        label: 'Pending reviews',
        trend: pendingRequests > 0 ? 'down' : 'stable'
      },
      badge: pendingRequests === 0 
        ? { text: 'All Clear', variant: 'default' as const }
        : { text: 'Review Needed', variant: 'secondary' as const },
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
          Role Management Dashboard
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
