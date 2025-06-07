
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  TestTube, 
  Plus, 
  Play, 
  Pause, 
  BarChart3, 
  TrendingUp,
  Mail,
  Target
} from 'lucide-react';
import { ABTestBuilder } from './ABTestBuilder';
import { ABTestingService, ABTest } from '@/services/crm/abTestingService';

export function ABTestingManager() {
  const [activeTab, setActiveTab] = useState('tests');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);
  const queryClient = useQueryClient();

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: () => ABTestingService.getABTests()
  });

  const startTestMutation = useMutation({
    mutationFn: (testId: string) => ABTestingService.startABTest(testId),
    onSuccess: () => {
      toast.success('A/B test started successfully');
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
    },
    onError: (error) => {
      toast.error(`Failed to start test: ${error.message}`);
    }
  });

  const pauseTestMutation = useMutation({
    mutationFn: (testId: string) => ABTestingService.pauseABTest(testId),
    onSuccess: () => {
      toast.success('A/B test paused successfully');
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
    },
    onError: (error) => {
      toast.error(`Failed to pause test: ${error.message}`);
    }
  });

  const handleCreateTest = () => {
    setEditingTest(null);
    setShowBuilder(true);
  };

  const handleEditTest = (test: ABTest) => {
    setEditingTest(test);
    setShowBuilder(true);
  };

  const handleToggleTest = (test: ABTest) => {
    if (test.status === 'running') {
      pauseTestMutation.mutate(test.id);
    } else if (test.status === 'draft' || test.status === 'paused') {
      startTestMutation.mutate(test.id);
    }
  };

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: ABTest['type']) => {
    switch (type) {
      case 'email_subject':
      case 'email_content':
        return <Mail className="h-4 w-4" />;
      case 'landing_page':
      case 'call_to_action':
        return <Target className="h-4 w-4" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  if (showBuilder) {
    return (
      <ABTestBuilder
        test={editingTest}
        onSave={() => {
          setShowBuilder(false);
          queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
        }}
        onCancel={() => setShowBuilder(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading A/B tests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">A/B Testing</h2>
          <p className="text-muted-foreground">
            Test and optimize your campaigns with statistical analysis
          </p>
        </div>
        <Button onClick={handleCreateTest}>
          <Plus className="h-4 w-4 mr-2" />
          Create A/B Test
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tests">Active Tests</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid gap-4">
            {tests.filter(test => test.status !== 'completed').map((test) => (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(test.type)}
                      <div>
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {test.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleTest(test)}
                        disabled={startTestMutation.isPending || pauseTestMutation.isPending}
                      >
                        {test.status === 'running' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTest(test)}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {test.variants.map((variant) => (
                      <div key={variant.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">
                              Variant {variant.id.toUpperCase()}: {variant.name}
                            </div>
                            {test.winner === variant.id && (
                              <Badge className="bg-green-100 text-green-800">
                                Winner
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {variant.traffic_split}% traffic
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">{variant.metrics.sent}</div>
                            <div className="text-xs text-muted-foreground">Sent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {variant.metrics.open_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Open Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {variant.metrics.click_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Click Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {variant.metrics.conversion_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Conversion</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {test.statistical_significance && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        Statistical significance achieved ({test.confidence_level}% confidence)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {tests.filter(test => test.status !== 'completed').length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No active A/B tests found</p>
                  <Button className="mt-4" onClick={handleCreateTest}>
                    Create Your First A/B Test
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid gap-4">
            {tests.filter(test => test.status === 'completed').map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(test.type)}
                    {test.name}
                    <Badge className="bg-blue-100 text-blue-800">
                      Completed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {test.variants.map((variant) => (
                      <div key={variant.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">
                              Variant {variant.id.toUpperCase()}: {variant.name}
                            </div>
                            {test.winner === variant.id && (
                              <Badge className="bg-green-100 text-green-800">
                                Winner
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {variant.metrics.open_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Open Rate</div>
                            <Progress 
                              value={variant.metrics.open_rate} 
                              className="mt-1 h-2"
                            />
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {variant.metrics.click_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Click Rate</div>
                            <Progress 
                              value={variant.metrics.click_rate} 
                              className="mt-1 h-2"
                            />
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {variant.metrics.conversion_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Conversion</div>
                            <Progress 
                              value={variant.metrics.conversion_rate} 
                              className="mt-1 h-2"
                            />
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{variant.metrics.sent}</div>
                            <div className="text-xs text-muted-foreground">Total Sent</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {tests.filter(test => test.status === 'completed').length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No completed A/B tests found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Testing Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {tests.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Performance Summary</h4>
                    <p className="text-blue-800 text-sm">
                      You have {tests.filter(t => t.status === 'running').length} active tests and {tests.filter(t => t.status === 'completed').length} completed tests.
                    </p>
                  </div>
                  
                  {tests.filter(t => t.statistical_significance).length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Statistically Significant Results</h4>
                      <p className="text-green-800 text-sm">
                        {tests.filter(t => t.statistical_significance).length} of your tests have achieved statistical significance.
                      </p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Recommendation</h4>
                    <p className="text-yellow-800 text-sm">
                      Continue testing different approaches to optimize your campaign performance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No insights available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create and run A/B tests to see insights and recommendations here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
