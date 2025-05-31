
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Database,
  Activity
} from 'lucide-react';
import { SystemConfiguration } from '@/services/configuration/configurationManager';

interface ConfigurationStatsCardsProps {
  configurations: SystemConfiguration[];
  categories: Record<string, any>;
}

export const ConfigurationStatsCards: React.FC<ConfigurationStatsCardsProps> = ({
  configurations,
  categories
}) => {
  const stats = React.useMemo(() => {
    const totalConfigs = configurations.length;
    const publicConfigs = configurations.filter(c => c.isPublic).length;
    const restartRequired = configurations.filter(c => c.requiresRestart).length;
    const categoryCount = Object.keys(categories).length;
    
    return {
      total: totalConfigs,
      public: publicConfigs,
      private: totalConfigs - publicConfigs,
      restartRequired,
      categories: categoryCount
    };
  }, [configurations, categories]);

  const statsCards = [
    {
      title: 'Total Configurations',
      value: stats.total,
      icon: Settings,
      description: 'Active system configurations',
      color: 'blue'
    },
    {
      title: 'Configuration Categories',
      value: stats.categories,
      icon: Database,
      description: 'Organized configuration groups',
      color: 'purple'
    },
    {
      title: 'Public Settings',
      value: stats.public,
      icon: CheckCircle,
      description: 'User-visible configurations',
      color: 'green'
    },
    {
      title: 'Restart Required',
      value: stats.restartRequired,
      icon: AlertTriangle,
      description: 'Changes requiring system restart',
      color: stats.restartRequired > 0 ? 'red' : 'gray'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50',
      purple: 'text-purple-600 bg-purple-50',
      green: 'text-green-600 bg-green-50',
      red: 'text-red-600 bg-red-50',
      gray: 'text-gray-600 bg-gray-50'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
              {stat.value}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stat.description}
            </p>
            {stat.color === 'red' && stat.value > 0 && (
              <Badge variant="secondary" className="mt-2 text-xs">
                Action Required
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
