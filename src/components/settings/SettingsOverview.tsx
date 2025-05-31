import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Mail, 
  Database, 
  Activity,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export const SettingsOverview: React.FC = () => {
  const { systemStatus } = useSystemHealth();
  const { data: settings } = useSystemSettings();

  const overviewCards = [
    {
      title: "System Status",
      value: systemStatus?.overall || "Healthy",
      icon: Activity,
      color: systemStatus?.overall === 'healthy' ? 'text-green-600' : 'text-red-600',
      bgColor: systemStatus?.overall === 'healthy' ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: "Active Configurations",
      value: settings?.length || 0,
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: "Email Templates",
      value: "12",
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: "Backup Status",
      value: "Current",
      icon: Database,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {overviewCards.map((card, index) => (
        <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <div className="flex items-center mt-2">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-gray-500">Operational</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
