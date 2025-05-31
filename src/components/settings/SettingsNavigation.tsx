
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Mail, 
  Shield, 
  Database, 
  Bell,
  Navigation,
  ChevronRight
} from 'lucide-react';

interface SettingsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSystemAdmin: boolean;
}

export const SettingsNavigation: React.FC<SettingsNavigationProps> = ({
  activeTab,
  onTabChange,
  isSystemAdmin
}) => {
  const navigationItems = [
    {
      id: 'configuration',
      title: 'System Configuration',
      description: 'Manage core system settings and configurations',
      icon: Settings,
      badge: null,
      color: 'blue'
    },
    {
      id: 'email',
      title: 'Email Templates',
      description: 'Configure automated email templates and notifications',
      icon: Mail,
      badge: '12 Templates',
      color: 'green'
    },
    {
      id: 'permissions',
      title: 'Role Permissions',
      description: 'Manage user roles and access permissions',
      icon: Shield,
      badge: 'Security',
      color: 'purple'
    },
    {
      id: 'backup',
      title: 'Backup & Recovery',
      description: 'Configure data backup and recovery settings',
      icon: Database,
      badge: null,
      color: 'amber'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage system notification preferences',
      icon: Bell,
      badge: null,
      color: 'indigo'
    }
  ];

  if (isSystemAdmin) {
    navigationItems.push({
      id: 'navigation',
      title: 'Navigation Control',
      description: 'Configure sidebar navigation for different user roles',
      icon: Navigation,
      badge: 'Admin Only',
      color: 'red'
    });
  }

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: {
        icon: isActive ? 'text-blue-600' : 'text-blue-500',
        bg: isActive ? 'bg-blue-100' : 'bg-blue-50',
        border: isActive ? 'border-blue-200' : 'border-blue-100'
      },
      green: {
        icon: isActive ? 'text-green-600' : 'text-green-500',
        bg: isActive ? 'bg-green-100' : 'bg-green-50',
        border: isActive ? 'border-green-200' : 'border-green-100'
      },
      purple: {
        icon: isActive ? 'text-purple-600' : 'text-purple-500',
        bg: isActive ? 'bg-purple-100' : 'bg-purple-50',
        border: isActive ? 'border-purple-200' : 'border-purple-100'
      },
      amber: {
        icon: isActive ? 'text-amber-600' : 'text-amber-500',
        bg: isActive ? 'bg-amber-100' : 'bg-amber-50',
        border: isActive ? 'border-amber-200' : 'border-amber-100'
      },
      indigo: {
        icon: isActive ? 'text-indigo-600' : 'text-indigo-500',
        bg: isActive ? 'bg-indigo-100' : 'bg-indigo-50',
        border: isActive ? 'border-indigo-200' : 'border-indigo-100'
      },
      red: {
        icon: isActive ? 'text-red-600' : 'text-red-500',
        bg: isActive ? 'bg-red-100' : 'bg-red-50',
        border: isActive ? 'border-red-200' : 'border-red-100'
      }
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
      {navigationItems.map((item) => {
        const isActive = activeTab === item.id;
        const colors = getColorClasses(item.color, isActive);
        
        return (
          <Card
            key={item.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              isActive 
                ? `${colors.border} shadow-md` 
                : 'border-gray-100 hover:border-gray-200'
            }`}
            onClick={() => onTabChange(item.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <item.icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">
                      {item.title}
                    </CardTitle>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="mt-1 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${
                  isActive ? 'rotate-90 text-primary' : 'text-gray-400'
                }`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
