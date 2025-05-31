
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileCheck, 
  Award, 
  History, 
  Archive, 
  Plus, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

interface NavigationCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  stats?: {
    primary: number;
    secondary?: number;
    trend?: 'up' | 'down' | 'stable';
    label: string;
  };
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  action: () => void;
}

interface CertificateNavigationCardsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  canManageRequests: boolean;
  stats?: {
    totalCertificates: number;
    pendingRequests: number;
    recentActivity: number;
    archivedRequests: number;
  };
}

export const CertificateNavigationCards: React.FC<CertificateNavigationCardsProps> = ({
  activeTab,
  onTabChange,
  canManageRequests,
  stats
}) => {
  const navigationCards: NavigationCard[] = [
    {
      id: 'batch',
      title: 'Batch Upload',
      description: 'Upload multiple certificates efficiently with roster files',
      icon: Upload,
      gradient: 'from-blue-500 to-blue-600',
      stats: {
        primary: stats?.recentActivity || 0,
        label: 'Recent uploads',
        trend: 'up'
      },
      action: () => onTabChange('batch')
    },
    {
      id: 'requests',
      title: canManageRequests ? 'Pending Approvals' : 'My Requests',
      description: canManageRequests 
        ? 'Review and approve certificate requests' 
        : 'Track your certificate request status',
      icon: FileCheck,
      gradient: 'from-amber-500 to-orange-600',
      stats: {
        primary: stats?.pendingRequests || 0,
        label: 'Pending review',
        trend: 'stable'
      },
      badge: stats?.pendingRequests && stats.pendingRequests > 0 
        ? { text: 'Action Required', variant: 'destructive' as const }
        : undefined,
      action: () => onTabChange('requests')
    },
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'View and manage issued certificates',
      icon: Award,
      gradient: 'from-green-500 to-emerald-600',
      stats: {
        primary: stats?.totalCertificates || 0,
        label: 'Total certificates',
        trend: 'up'
      },
      action: () => onTabChange('certificates')
    },
    {
      id: 'rosters',
      title: 'Rosters',
      description: 'Certificate rosters and analytics dashboard',
      icon: History,
      gradient: 'from-purple-500 to-purple-600',
      stats: {
        primary: 0,
        label: 'Active rosters',
        trend: 'stable'
      },
      action: () => onTabChange('rosters')
    },
    {
      id: 'archived',
      title: 'Archived',
      description: 'Archived requests and historical data',
      icon: Archive,
      gradient: 'from-gray-500 to-gray-600',
      stats: {
        primary: stats?.archivedRequests || 0,
        label: 'Archived items',
        trend: 'stable'
      },
      action: () => onTabChange('archived')
    }
  ];

  // Add admin-only cards
  if (canManageRequests) {
    navigationCards.push(
      {
        id: 'recovery',
        title: 'Recovery',
        description: 'Failed certificate recovery and troubleshooting',
        icon: AlertTriangle,
        gradient: 'from-red-500 to-red-600',
        badge: { text: 'Admin Only', variant: 'outline' as const },
        action: () => onTabChange('recovery')
      },
      {
        id: 'new',
        title: 'New Certificate',
        description: 'Create individual certificates manually',
        icon: Plus,
        gradient: 'from-indigo-500 to-indigo-600',
        action: () => onTabChange('new')
      }
    );
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                Open
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
