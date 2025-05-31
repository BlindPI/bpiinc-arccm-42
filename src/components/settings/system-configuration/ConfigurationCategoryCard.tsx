
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Edit,
  MoreVertical
} from 'lucide-react';
import { SystemConfiguration } from '@/services/configuration/configurationManager';
import { ConfigurationDetailModal } from './ConfigurationDetailModal';

interface ConfigurationCategoryCardProps {
  categoryKey: string;
  category: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    configs: SystemConfiguration[];
  };
  searchTerm: string;
}

export const ConfigurationCategoryCard: React.FC<ConfigurationCategoryCardProps> = ({
  categoryKey,
  category,
  searchTerm
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfiguration | null>(null);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        icon: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        accent: 'bg-blue-100'
      },
      green: {
        icon: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        accent: 'bg-green-100'
      },
      purple: {
        icon: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        accent: 'bg-purple-100'
      },
      amber: {
        icon: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        accent: 'bg-amber-100'
      },
      indigo: {
        icon: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        accent: 'bg-indigo-100'
      },
      emerald: {
        icon: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        accent: 'bg-emerald-100'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const colors = getColorClasses(category.color);
  const publicConfigs = category.configs.filter(c => c.isPublic).length;
  const restartRequired = category.configs.filter(c => c.requiresRestart).length;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <>
      <Card className={`border-2 ${colors.border} hover:shadow-lg transition-all duration-200 cursor-pointer`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <category.icon className={`h-6 w-6 ${colors.icon}`} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {highlightText(category.title, searchTerm)}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {highlightText(category.description, searchTerm)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${
                showDetails ? 'rotate-90' : ''
              }`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Category Statistics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {category.configs.length}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {publicConfigs}
              </div>
              <div className="text-xs text-gray-500">Public</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                restartRequired > 0 ? 'text-red-600' : 'text-gray-400'
              }`}>
                {restartRequired}
              </div>
              <div className="text-xs text-gray-500">Restart</div>
            </div>
          </div>

          {/* Health Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-600">Operational</span>
            </div>
            {restartRequired > 0 && (
              <Badge variant="secondary" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Restart Required
              </Badge>
            )}
          </div>

          {/* Configuration List (when expanded) */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {category.configs.slice(0, 5).map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedConfig(config)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {highlightText(config.key, searchTerm)}
                      </span>
                      {config.isPublic ? (
                        <Eye className="h-3 w-3 text-green-500" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      )}
                      {config.requiresRestart && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    {config.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {highlightText(config.description, searchTerm)}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {category.configs.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View {category.configs.length - 5} more configurations
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Detail Modal */}
      {selectedConfig && (
        <ConfigurationDetailModal
          configuration={selectedConfig}
          onClose={() => setSelectedConfig(null)}
          categoryColor={category.color}
        />
      )}
    </>
  );
};
