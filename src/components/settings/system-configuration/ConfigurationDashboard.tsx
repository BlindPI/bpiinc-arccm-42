
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Search, 
  Filter, 
  Download, 
  Upload,
  CheckCircle,
  AlertTriangle,
  Database,
  Shield,
  Mail,
  Bell,
  Navigation,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ConfigurationManager, SystemConfiguration } from '@/services/configuration/configurationManager';
import { ConfigurationCategoryCard } from './ConfigurationCategoryCard';
import { ConfigurationSearchFilters } from './ConfigurationSearchFilters';
import { ConfigurationStatsCards } from './ConfigurationStatsCards';
import { useConfigurationManager } from '@/hooks/useConfigurationManager';

interface CategoryConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  configs: SystemConfiguration[];
}

type CategoryConfigMap = Record<string, CategoryConfig>;

export const ConfigurationDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { configurations, isLoading } = useConfigurationManager();
  const { exportConfig } = useConfigurationManager();

  const configurationCategories: CategoryConfigMap = React.useMemo(() => {
    if (!configurations) return {};
    
    const categoryMap: CategoryConfigMap = {
      system: {
        title: 'System Core',
        description: 'Core system settings and operational parameters',
        icon: Settings,
        color: 'blue',
        configs: []
      },
      email: {
        title: 'Email Configuration',
        description: 'SMTP settings and email delivery configuration',
        icon: Mail,
        color: 'green',
        configs: []
      },
      security: {
        title: 'Security & Access',
        description: 'Authentication, permissions, and security policies',
        icon: Shield,
        color: 'purple',
        configs: []
      },
      notifications: {
        title: 'Notifications',
        description: 'System notification preferences and settings',
        icon: Bell,
        color: 'amber',
        configs: []
      },
      navigation: {
        title: 'Navigation Control',
        description: 'User interface and navigation visibility settings',
        icon: Navigation,
        color: 'indigo',
        configs: []
      },
      certificates: {
        title: 'Certificates',
        description: 'Certificate generation and template settings',
        icon: Database,
        color: 'emerald',
        configs: []
      }
    };

    // Group configurations by category
    configurations.forEach(config => {
      const category = categoryMap[config.category];
      if (category) {
        category.configs.push(config);
      } else {
        // Create dynamic category for unknown categories
        if (!categoryMap[config.category]) {
          categoryMap[config.category] = {
            title: config.category.charAt(0).toUpperCase() + config.category.slice(1),
            description: `${config.category} related configurations`,
            icon: Settings,
            color: 'gray',
            configs: []
          };
        }
        categoryMap[config.category].configs.push(config);
      }
    });

    // Filter categories that have configurations
    return Object.entries(categoryMap)
      .filter(([_, category]) => category.configs.length > 0)
      .reduce((acc, [key, category]) => {
        acc[key] = category;
        return acc;
      }, {} as CategoryConfigMap);
  }, [configurations]);

  const filteredCategories: CategoryConfigMap = React.useMemo(() => {
    if (!searchTerm && !selectedCategory) return configurationCategories;
    
    const filtered: CategoryConfigMap = {};
    
    Object.entries(configurationCategories).forEach(([key, category]) => {
      if (selectedCategory && key !== selectedCategory) return;
      
      if (searchTerm) {
        const matchingConfigs = category.configs.filter((config: SystemConfiguration) =>
          config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          config.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          JSON.stringify(config.value).toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (matchingConfigs.length > 0) {
          filtered[key] = { ...category, configs: matchingConfigs };
        }
      } else {
        filtered[key] = category;
      }
    });
    
    return filtered;
  }, [configurationCategories, searchTerm, selectedCategory]);

  const handleExport = () => {
    exportConfig.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
          <p className="text-gray-600">Manage core system settings and configurations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportConfig.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search configurations by key, description, or value..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {showFilters && (
          <ConfigurationSearchFilters
            categories={Object.keys(configurationCategories)}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        )}
      </div>

      {/* Configuration Statistics */}
      <ConfigurationStatsCards 
        configurations={configurations || []}
        categories={configurationCategories}
      />

      {/* Configuration Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(filteredCategories).map(([categoryKey, category]) => (
          <ConfigurationCategoryCard
            key={categoryKey}
            categoryKey={categoryKey}
            category={category}
            searchTerm={searchTerm}
          />
        ))}
      </div>

      {Object.keys(filteredCategories).length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No configurations found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
