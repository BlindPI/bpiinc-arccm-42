import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Target,
  Calculator,
  UserCheck,
  Cog,
  Shield,
  Database,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { PipelineConfiguration } from '@/components/crm/settings/PipelineConfiguration';
import { LeadScoringSetup } from '@/components/crm/settings/LeadScoringSetup';
import { AssignmentRulesManagement } from '@/components/crm/settings/AssignmentRulesManagement';
import { CRMLayout } from '@/components/crm/layout/CRMLayout';

export function CRMSettingsPage() {
  const [activeTab, setActiveTab] = useState('pipeline');

  // Mock settings summary data
  const settingsSummary = {
    pipelineStages: 6,
    scoringRules: 8,
    assignmentRules: 4,
    lastUpdated: '2024-01-20T10:30:00Z'
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Settings</h1>
            <p className="text-gray-600">Configure pipeline stages, lead scoring, and assignment rules</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import Settings
            </Button>
          </div>
        </div>

        {/* Settings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pipeline Stages</p>
                  <p className="text-2xl font-bold text-gray-900">{settingsSummary.pipelineStages}</p>
                  <p className="text-xs text-gray-500 mt-1">Active stages configured</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scoring Rules</p>
                  <p className="text-2xl font-bold text-gray-900">{settingsSummary.scoringRules}</p>
                  <p className="text-xs text-gray-500 mt-1">Lead scoring rules active</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assignment Rules</p>
                  <p className="text-2xl font-bold text-gray-900">{settingsSummary.assignmentRules}</p>
                  <p className="text-xs text-gray-500 mt-1">Auto-assignment rules</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(settingsSummary.lastUpdated).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Settings last modified</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Cog className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Pipeline Configuration
            </TabsTrigger>
            <TabsTrigger value="scoring" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Lead Scoring
            </TabsTrigger>
            <TabsTrigger value="assignment" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Assignment Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            <PipelineConfiguration showHeader={false} />
          </TabsContent>

          <TabsContent value="scoring" className="space-y-6">
            <LeadScoringSetup showHeader={false} />
          </TabsContent>

          <TabsContent value="assignment" className="space-y-6">
            <AssignmentRulesManagement showHeader={false} />
          </TabsContent>
        </Tabs>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>
              Current CRM system configuration and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  Security & Access
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Role-based access control enabled</li>
                  <li>• SA-only settings modification</li>
                  <li>• Audit logging for all changes</li>
                  <li>• Data encryption at rest</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  Data Management
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Automatic data backup enabled</li>
                  <li>• Real-time synchronization</li>
                  <li>• Data retention: 7 years</li>
                  <li>• GDPR compliance maintained</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Cog className="h-4 w-4 text-purple-600" />
                  System Status
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• All services operational</li>
                  <li>• Last backup: 2 hours ago</li>
                  <li>• Performance: Optimal</li>
                  <li>• Uptime: 99.9%</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common configuration tasks and system management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('pipeline')}
              >
                <Target className="h-6 w-6" />
                <span className="font-medium">Configure Pipeline</span>
                <span className="text-xs text-gray-500">Manage sales stages</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('scoring')}
              >
                <Calculator className="h-6 w-6" />
                <span className="font-medium">Setup Scoring</span>
                <span className="text-xs text-gray-500">Configure lead scoring</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('assignment')}
              >
                <UserCheck className="h-6 w-6" />
                <span className="font-medium">Assignment Rules</span>
                <span className="text-xs text-gray-500">Manage auto-assignment</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Download className="h-6 w-6" />
                <span className="font-medium">Export Settings</span>
                <span className="text-xs text-gray-500">Backup configuration</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuration Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Best Practices</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Test all changes in a staging environment first</li>
                  <li>• Document configuration changes and rationale</li>
                  <li>• Regular review and optimization of rules</li>
                  <li>• Monitor system performance after changes</li>
                  <li>• Maintain backup of working configurations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Important Notes</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Changes take effect immediately</li>
                  <li>• Some settings require system restart</li>
                  <li>• User permissions may affect visibility</li>
                  <li>• Audit logs track all modifications</li>
                  <li>• Contact support for complex configurations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}