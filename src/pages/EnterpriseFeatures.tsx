
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  BarChart3, 
  Smartphone, 
  Plug,
  Crown,
  Settings,
  Users,
  Globe
} from 'lucide-react';
import { SSOIntegrationManager } from '@/components/enterprise/SSOIntegrationManager';
import { AdvancedReportBuilder } from '@/components/enterprise/AdvancedReportBuilder';
import { MobileOptimizationPanel } from '@/components/mobile/MobileOptimizationPanel';
import { ApiIntegrationManager } from '@/components/integration/ApiIntegrationManager';

export default function EnterpriseFeatures() {
  const [activeTab, setActiveTab] = useState('sso');

  const features = [
    {
      id: 'sso',
      title: 'SSO Integration',
      description: 'Single Sign-On with SAML, OAuth, and OIDC providers',
      icon: Shield,
      component: SSOIntegrationManager,
      status: 'active'
    },
    {
      id: 'reports',
      title: 'Advanced Reports',
      description: 'Custom report builder with real-time analytics',
      icon: BarChart3,
      component: AdvancedReportBuilder,
      status: 'active'
    },
    {
      id: 'mobile',
      title: 'Mobile Optimization',
      description: 'Progressive Web App and mobile performance',
      icon: Smartphone,
      component: MobileOptimizationPanel,
      status: 'active'
    },
    {
      id: 'api',
      title: 'API Integration',
      description: 'Third-party integrations and API management',
      icon: Plug,
      component: ApiIntegrationManager,
      status: 'active'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'beta':
        return <Badge variant="secondary">Beta</Badge>;
      case 'coming_soon':
        return <Badge variant="outline">Coming Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const ActiveComponent = features.find(f => f.id === activeTab)?.component || SSOIntegrationManager;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-600" />
            Enterprise Features
          </h1>
          <p className="text-muted-foreground">
            Advanced capabilities for enterprise-scale operations
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Globe className="h-3 w-3" />
          Production Ready
        </Badge>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card 
              key={feature.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeTab === feature.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveTab(feature.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <IconComponent className="h-5 w-5 text-blue-600" />
                  {getStatusBadge(feature.status)}
                </div>
                <h3 className="font-medium mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <TabsTrigger key={feature.id} value={feature.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {feature.title}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {features.map((feature) => (
          <TabsContent key={feature.id} value={feature.id}>
            <feature.component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
