
import React from 'react';
import { ResponsiveGrid, GridItem } from '@/design-system/layout/ResponsiveGrid';
import { MetricWidget } from '../widgets/MetricWidget';
import { DashboardWidget } from '@/types/enterprise';
import { Users, FileText, Award, TrendingUp } from 'lucide-react';

interface DashboardGridProps {
  widgets?: DashboardWidget[];
  userRole?: string;
}

export function DashboardGrid({ widgets, userRole }: DashboardGridProps) {
  // Default widgets based on role
  const getDefaultWidgets = () => {
    const commonWidgets = [
      {
        id: 'total-users',
        title: 'Total Users',
        type: 'metric' as const,
        data: { value: '2,847', trend: { value: 12, label: 'from last month', direction: 'up' as const } }
      },
      {
        id: 'active-sessions',
        title: 'Active Sessions', 
        type: 'metric' as const,
        data: { value: '1,234', trend: { value: 8, label: 'from yesterday', direction: 'up' as const } }
      },
      {
        id: 'certificates-issued',
        title: 'Certificates Issued',
        type: 'metric' as const,
        data: { value: '456', trend: { value: 23, label: 'this week', direction: 'up' as const } }
      },
      {
        id: 'completion-rate',
        title: 'Completion Rate',
        type: 'metric' as const,
        data: { value: '89.2%', trend: { value: 4, label: 'improvement', direction: 'up' as const } }
      }
    ];

    return commonWidgets;
  };

  const widgetsToRender = widgets || getDefaultWidgets();

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'metric':
        const icons = {
          'total-users': <Users className="h-4 w-4" />,
          'active-sessions': <TrendingUp className="h-4 w-4" />,
          'certificates-issued': <Award className="h-4 w-4" />,
          'completion-rate': <FileText className="h-4 w-4" />
        };

        return (
          <MetricWidget
            key={widget.id}
            title={widget.title}
            value={widget.data?.value || '0'}
            trend={widget.data?.trend}
            icon={icons[widget.id as keyof typeof icons]}
          />
        );
      
      default:
        return (
          <div key={widget.id} className="p-4 border rounded-lg">
            <h3 className="font-medium">{widget.title}</h3>
            <p className="text-sm text-muted-foreground">Widget type: {widget.type}</p>
          </div>
        );
    }
  };

  return (
    <ResponsiveGrid columns={4} gap="lg">
      {widgetsToRender.map((widget) => (
        <GridItem key={widget.id} span={1}>
          {renderWidget(widget)}
        </GridItem>
      ))}
    </ResponsiveGrid>
  );
}
