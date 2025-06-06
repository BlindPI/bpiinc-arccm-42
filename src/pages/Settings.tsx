import React, { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Database, 
  Bell, 
  Navigation,
  Briefcase,
  AlertTriangle 
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isSystemAdmin = profile?.role === 'SA';
  const isAdmin = profile?.role === 'SA' || profile?.role === 'AD';

  const settingsCards = [
    {
      id: 'system',
      title: 'System Configuration',
      description: 'Manage core system settings and configurations',
      icon: SettingsIcon,
      color: 'blue',
      available: isAdmin
    },
    {
      id: 'permissions',
      title: 'Role Permissions',
      description: 'Manage user roles and access permissions',
      icon: Shield,
      color: 'purple',
      available: isAdmin
    },
    {
      id: 'backup',
      title: 'Backup & Recovery',
      description: 'Configure data backup and recovery settings',
      icon: Database,
      color: 'amber',
      available: isSystemAdmin
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage system notification preferences',
      icon: Bell,
      color: 'indigo',
      available: true
    },
    {
      id: 'navigation',
      title: 'Navigation Control',
      description: 'Configure sidebar navigation for different user roles',
      icon: Navigation,
      color: 'red',
      available: isSystemAdmin
    },
    {
      id: 'crm',
      title: 'CRM Settings',
      description: 'Configure CRM module settings and access controls',
      icon: Briefcase,
      color: 'cyan',
      available: isAdmin
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      amber: 'text-amber-600 bg-amber-50 border-amber-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      red: 'text-red-600 bg-red-50 border-red-200',
      cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure system settings and manage application preferences
        </p>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                System Status
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <SettingsIcon className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <div className="text-xs text-gray-500 mt-1">All systems operational</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                User Role
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{profile?.role || 'Unknown'}</div>
            <div className="text-xs text-gray-500 mt-1">Current access level</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Available Settings
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50">
                <Database className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {settingsCards.filter(card => card.available).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Accessible modules</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Last Updated
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-50">
                <Bell className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">Today</div>
            <div className="text-xs text-gray-500 mt-1">Configuration sync</div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card) => {
          const colors = getColorClasses(card.color);
          
          return (
            <Card
              key={card.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                card.available ? 'hover:border-gray-200' : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => card.available && setActiveTab(card.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900">
                        {card.title}
                      </CardTitle>
                      {!card.available && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Access Restricted
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!card.available && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {card.description}
                </p>
                {!card.available && (
                  <p className="text-xs text-amber-600 mt-2">
                    Requires {card.id === 'navigation' || card.id === 'backup' ? 'System Administrator' : 'Administrator'} privileges
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Setting Content */}
      {activeTab !== 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {settingsCards.find(card => card.id === activeTab)?.title || 'Settings'}
            </CardTitle>
            <CardDescription>
              Configuration options for this module
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Settings Module
              </h3>
              <p className="text-gray-600 mb-4">
                This settings module is currently being configured.
              </p>
              <Button variant="outline" onClick={() => setActiveTab('overview')}>
                Back to Overview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
