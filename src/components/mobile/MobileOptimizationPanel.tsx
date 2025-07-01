
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  Download,
  Settings,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';

interface DeviceMetrics {
  device_type: string;
  active_users: number;
  performance_score: number;
  load_time: number;
  error_rate: number;
}

export function MobileOptimizationPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [optimizationSettings, setOptimizationSettings] = useState({
    progressive_web_app: true,
    offline_mode: true,
    image_compression: true,
    lazy_loading: true,
    service_worker: true
  });

  // Mock device analytics data
  const deviceMetrics: DeviceMetrics[] = [
    {
      device_type: 'mobile',
      active_users: 245,
      performance_score: 87,
      load_time: 2.3,
      error_rate: 1.2
    },
    {
      device_type: 'tablet',
      active_users: 89,
      performance_score: 92,
      load_time: 1.8,
      error_rate: 0.8
    },
    {
      device_type: 'desktop',
      active_users: 456,
      performance_score: 94,
      load_time: 1.5,
      error_rate: 0.5
    }
  ];

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      case 'desktop': return <Monitor className="h-5 w-5" />;
      default: return <Smartphone className="h-5 w-5" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleOptimizationToggle = (setting: string) => {
    setOptimizationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-blue-600" />
            Mobile App Optimization
          </h1>
          <p className="text-muted-foreground">
            Monitor and optimize mobile performance across all devices
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Metrics
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Settings</TabsTrigger>
          <TabsTrigger value="analytics">Mobile Analytics</TabsTrigger>
          <TabsTrigger value="pwa">PWA Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Device Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deviceMetrics.map((metric) => (
              <Card key={metric.device_type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getDeviceIcon(metric.device_type)}
                    {metric.device_type.charAt(0).toUpperCase() + metric.device_type.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Users</span>
                    <Badge variant="outline">{metric.active_users}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Performance Score</span>
                      <span className={`font-bold ${getPerformanceColor(metric.performance_score)}`}>
                        {metric.performance_score}%
                      </span>
                    </div>
                    <Progress value={metric.performance_score} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Load Time</span>
                    <span className="font-medium">{metric.load_time}s</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="font-medium">{metric.error_rate}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Real-time Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Real-time Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">790</div>
                  <div className="text-sm text-muted-foreground">Total Active Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">91%</div>
                  <div className="text-sm text-muted-foreground">Overall Performance</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">1.9s</div>
                  <div className="text-sm text-muted-foreground">Avg Load Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">0.8%</div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Progressive Web App (PWA)</div>
                    <div className="text-sm text-muted-foreground">
                      Enable app-like experience with offline capabilities
                    </div>
                  </div>
                  <Switch
                    checked={optimizationSettings.progressive_web_app}
                    onCheckedChange={() => handleOptimizationToggle('progressive_web_app')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Offline Mode</div>
                    <div className="text-sm text-muted-foreground">
                      Cache critical data for offline functionality
                    </div>
                  </div>
                  <Switch
                    checked={optimizationSettings.offline_mode}
                    onCheckedChange={() => handleOptimizationToggle('offline_mode')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Image Compression</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically compress images for faster loading
                    </div>
                  </div>
                  <Switch
                    checked={optimizationSettings.image_compression}
                    onCheckedChange={() => handleOptimizationToggle('image_compression')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Lazy Loading</div>
                    <div className="text-sm text-muted-foreground">
                      Load content as users scroll to improve initial load time
                    </div>
                  </div>
                  <Switch
                    checked={optimizationSettings.lazy_loading}
                    onCheckedChange={() => handleOptimizationToggle('lazy_loading')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Service Worker</div>
                    <div className="text-sm text-muted-foreground">
                      Background sync and push notifications
                    </div>
                  </div>
                  <Switch
                    checked={optimizationSettings.service_worker}
                    onCheckedChange={() => handleOptimizationToggle('service_worker')}
                  />
                </div>
              </div>

              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Apply Optimization Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Mobile Usage Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Device Distribution</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Mobile
                        </span>
                        <span className="font-medium">58%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Desktop
                        </span>
                        <span className="font-medium">31%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Tablet className="h-4 w-4" />
                          Tablet
                        </span>
                        <span className="font-medium">11%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Connection Types</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Wifi className="h-4 w-4" />
                          WiFi
                        </span>
                        <span className="font-medium">67%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>4G/5G</span>
                        <span className="font-medium">28%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>3G</span>
                        <span className="font-medium">5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Most Used Features (Mobile)</h3>
                  <div className="space-y-2">
                    {[
                      { feature: 'Certificate Verification', usage: 89 },
                      { feature: 'Team Management', usage: 76 },
                      { feature: 'Course Enrollment', usage: 64 },
                      { feature: 'Analytics Dashboard', usage: 52 }
                    ].map((item) => (
                      <div key={item.feature} className="flex items-center justify-between">
                        <span className="text-sm">{item.feature}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={item.usage} className="w-20 h-2" />
                          <span className="text-sm font-medium w-10">{item.usage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pwa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progressive Web App Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Installation Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>PWA Installs</span>
                      <Badge variant="default">324</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Install Rate</span>
                      <span className="font-medium">23%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Retention (7-day)</span>
                      <span className="font-medium">78%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Manifest Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="w-3 h-3 p-0"></Badge>
                      <span className="text-sm">Web App Manifest Valid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="w-3 h-3 p-0"></Badge>
                      <span className="text-sm">Service Worker Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="w-3 h-3 p-0"></Badge>
                      <span className="text-sm">HTTPS Enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="w-3 h-3 p-0"></Badge>
                      <span className="text-sm">Installable</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PWA Installation Guide
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
