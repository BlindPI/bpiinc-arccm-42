
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Settings, 
  Layout, 
  Eye, 
  EyeOff,
  Move,
  BarChart3,
  Users,
  MapPin,
  Shield
} from 'lucide-react';

interface CustomizableDashboardProps {
  teamAnalytics: any;
  executiveData: any;
  heatmapData: any;
  riskScores: any;
}

interface DashboardWidget {
  id: string;
  title: string;
  component: string;
  visible: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
}

export function CustomizableDashboard({
  teamAnalytics,
  executiveData,
  heatmapData,
  riskScores
}: CustomizableDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { id: 'teams-overview', title: 'Teams Overview', component: 'TeamsOverview', visible: true, position: 1, size: 'medium' },
    { id: 'performance-metrics', title: 'Performance Metrics', component: 'PerformanceMetrics', visible: true, position: 2, size: 'large' },
    { id: 'compliance-status', title: 'Compliance Status', component: 'ComplianceStatus', visible: true, position: 3, size: 'medium' },
    { id: 'location-summary', title: 'Location Summary', component: 'LocationSummary', visible: true, position: 4, size: 'small' },
    { id: 'risk-alerts', title: 'Risk Alerts', component: 'RiskAlerts', visible: false, position: 5, size: 'medium' },
    { id: 'trend-analysis', title: 'Trend Analysis', component: 'TrendAnalysis', visible: false, position: 6, size: 'large' }
  ]);

  const [editMode, setEditMode] = useState(false);

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const visibleWidgets = widgets.filter(w => w.visible).sort((a, b) => a.position - b.position);

  const renderWidget = (widget: DashboardWidget) => {
    const baseClasses = "relative";
    const sizeClasses = {
      small: "col-span-1",
      medium: "col-span-2", 
      large: "col-span-3"
    };

    switch (widget.component) {
      case 'TeamsOverview':
        return (
          <Card className={`${baseClasses} ${sizeClasses[widget.size]}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teams Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {teamAnalytics?.totalTeams || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {teamAnalytics?.totalMembers || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'PerformanceMetrics':
        return (
          <Card className={`${baseClasses} ${sizeClasses[widget.size]}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Performance</span>
                  <Badge variant="default">
                    {Math.round(teamAnalytics?.averagePerformance || 0)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Compliance Score</span>
                  <Badge variant="secondary">
                    {Math.round(teamAnalytics?.averageCompliance || 0)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'ComplianceStatus':
        return (
          <Card className={`${baseClasses} ${sizeClasses[widget.size]}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round(teamAnalytics?.averageCompliance || 0)}%
                </div>
                <div className="text-sm text-muted-foreground">Overall Compliance</div>
                <Badge variant="outline" className="mt-2">
                  {riskScores?.length || 0} active risks
                </Badge>
              </div>
            </CardContent>
          </Card>
        );

      case 'LocationSummary':
        return (
          <Card className={`${baseClasses} ${sizeClasses[widget.size]}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(teamAnalytics?.teamsByLocation || {}).slice(0, 3).map(([location, count]) => (
                  <div key={location} className="flex justify-between text-sm">
                    <span>{location}</span>
                    <Badge variant="outline">{String(count)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className={`${baseClasses} ${sizeClasses[widget.size]}`}>
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Widget content coming soon
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Dashboard</h2>
          <p className="text-muted-foreground">Personalize your analytics view</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {editMode ? 'Done Editing' : 'Edit Layout'}
          </Button>
        </div>
      </div>

      {/* Widget Configuration Panel */}
      {editMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Widget Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center space-x-3 p-3 border rounded">
                  <Checkbox
                    checked={widget.visible}
                    onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{widget.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Size: {widget.size} • Position: {widget.position}
                    </div>
                  </div>
                  {widget.visible ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleWidgets.map((widget) => (
          <div key={widget.id} className="relative">
            {editMode && (
              <div className="absolute top-2 right-2 z-10">
                <Button variant="ghost" size="sm">
                  <Move className="h-4 w-4" />
                </Button>
              </div>
            )}
            {renderWidget(widget)}
          </div>
        ))}
      </div>

      {visibleWidgets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Layout className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No widgets are currently visible</p>
            <p className="text-sm text-gray-500">
              Click "Edit Layout" to configure your dashboard widgets
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
