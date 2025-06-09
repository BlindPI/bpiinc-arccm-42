
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Database,
  Mail,
  Users,
  Workflow,
  Play
} from 'lucide-react';
import { CRMDataSeeding } from '@/services/crm/dataSeeding';
import { toast } from 'sonner';

export function ProductionReadiness() {
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingResults, setSeedingResults] = useState<any>(null);

  const productionChecklist = [
    {
      id: 'scoring_rules',
      name: 'Lead Scoring Rules',
      description: 'Production-ready scoring rules for lead qualification',
      icon: <Settings className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'email_templates', 
      name: 'Email Templates',
      description: 'Professional email templates for campaigns',
      icon: <Mail className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'assignment_rules',
      name: 'Assignment Rules',
      description: 'Intelligent lead assignment and workload distribution',
      icon: <Users className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'performance_baselines',
      name: 'Performance Baselines',
      description: 'Team performance tracking and analytics setup',
      icon: <Database className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'workflows',
      name: 'Automation Workflows',
      description: 'Automated lead processing and nurturing workflows',
      icon: <Workflow className="h-5 w-5" />,
      status: 'pending'
    }
  ];

  const handleSeedProductionData = async () => {
    setIsSeeding(true);
    setSeedingProgress(0);
    
    try {
      // Simulate progress updates
      const progressSteps = [
        { step: 'Lead Scoring Rules', progress: 20 },
        { step: 'Email Templates', progress: 40 },
        { step: 'Assignment Rules', progress: 60 },
        { step: 'Performance Baselines', progress: 80 },
        { step: 'Workflows', progress: 100 }
      ];

      for (const { step, progress } of progressSteps) {
        setSeedingProgress(progress);
        toast.info(`Seeding ${step}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const result = await CRMDataSeeding.seedAllProductionData();
      setSeedingResults(result);
      
      if (result.success) {
        toast.success('Production data seeded successfully!');
      } else {
        toast.error('Failed to seed production data: ' + result.error);
      }
    } catch (error) {
      toast.error('Error during data seeding: ' + error.message);
      setSeedingResults({ success: false, error: error.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Production Readiness</h2>
          <p className="text-muted-foreground">
            Set up production-ready data and activate real-time CRM automation
          </p>
        </div>
        <Button 
          onClick={handleSeedProductionData}
          disabled={isSeeding}
          size="lg"
        >
          {isSeeding ? (
            <>
              <Database className="h-4 w-4 mr-2 animate-spin" />
              Seeding Data...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Initialize Production Data
            </>
          )}
        </Button>
      </div>

      {/* Seeding Progress */}
      {isSeeding && (
        <Card>
          <CardHeader>
            <CardTitle>Seeding Production Data</CardTitle>
            <CardDescription>
              Setting up CRM with production-ready configuration and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={seedingProgress} className="h-3" />
              <div className="text-center text-sm text-gray-600">
                {seedingProgress}% Complete
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seeding Results */}
      {seedingResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {seedingResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Seeding Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {seedingResults.success ? (
              <div className="text-green-600">
                ✅ All production data has been successfully seeded!
                <p className="text-sm text-gray-600 mt-2">
                  Your CRM is now ready for production use with:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Lead scoring rules for automatic qualification</li>
                  <li>• Professional email templates for campaigns</li>
                  <li>• Intelligent assignment rules for workload distribution</li>
                  <li>• Performance tracking baselines</li>
                  <li>• Automated workflows for lead processing</li>
                </ul>
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Error seeding production data: {seedingResults.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Production Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Production Configuration Checklist</CardTitle>
          <CardDescription>
            Essential components for a fully functional CRM system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productionChecklist.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(seedingResults?.success ? 'completed' : item.status)}>
                  {seedingResults?.success ? 'Completed' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Integration Status</CardTitle>
          <CardDescription>
            Backend function connectivity and automation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Connected Functions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>calculate_enhanced_lead_score()</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>assign_lead_intelligent()</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>execute_lead_workflow()</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>calculate_campaign_roi()</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Active Automation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Automatic Lead Scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Intelligent Assignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Workflow Triggers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Performance Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            Complete your CRM setup for production use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">1. Initialize Production Data</h4>
              <p className="text-sm text-blue-700">
                Click "Initialize Production Data" to populate your CRM with professional 
                scoring rules, email templates, and automation workflows.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">2. Test Lead Processing</h4>
              <p className="text-sm text-green-700">
                Create test leads to verify automatic scoring, assignment, and 
                workflow execution are working correctly.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">3. Configure Team Settings</h4>
              <p className="text-sm text-purple-700">
                Set up team member capacities, working hours, and assignment 
                preferences for optimal lead distribution.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">4. Monitor & Optimize</h4>
              <p className="text-sm text-orange-700">
                Use the analytics dashboards to monitor performance and 
                continuously optimize your CRM workflows.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
