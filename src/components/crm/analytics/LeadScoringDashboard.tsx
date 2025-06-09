import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Plus, Settings, TrendingUp, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RealCRMService } from '@/services/crm/realCRMService';
import { toast } from 'sonner';

export function LeadScoringDashboard() {
  const queryClient = useQueryClient();
  const [newRule, setNewRule] = useState({
    rule_name: '',
    field_name: '',
    operator: 'equals',
    field_value: '',
    score_points: 0,
    priority: 1
  });

  const { data: scoringRules = [], isLoading } = useQuery({
    queryKey: ['lead-scoring-rules'],
    queryFn: () => RealCRMService.getLeadScoringRules()
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['enhanced-crm-leads'],
    queryFn: () => RealCRMService.getLeads()
  });

  const createRuleMutation = useMutation({
    mutationFn: (rule: typeof newRule) => RealCRMService.createScoringRule(rule),
    onSuccess: () => {
      toast.success('Scoring rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      setNewRule({
        rule_name: '',
        field_name: '',
        operator: 'equals',
        field_value: '',
        score_points: 0,
        priority: 1
      });
    }
  });

  const handleCreateRule = () => {
    if (!newRule.rule_name || !newRule.field_name || !newRule.field_value) {
      toast.error('Please fill in all required fields');
      return;
    }
    createRuleMutation.mutate(newRule);
  };

  // Calculate scoring analytics
  const scoringAnalytics = React.useMemo(() => {
    const scoreDistribution = leads.reduce((acc, lead) => {
      const scoreRange = Math.floor(lead.lead_score / 10) * 10;
      const key = `${scoreRange}-${scoreRange + 9}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgScore = leads.length > 0 
      ? leads.reduce((sum, lead) => sum + lead.lead_score, 0) / leads.length 
      : 0;

    const highScoreLeads = leads.filter(lead => lead.lead_score >= 70).length;
    const conversionRate = leads.length > 0 
      ? (leads.filter(lead => lead.lead_status === 'converted').length / leads.length) * 100 
      : 0;

    return {
      scoreDistribution,
      avgScore: Math.round(avgScore),
      highScoreLeads,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalLeads: leads.length
    };
  }, [leads]);

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scoringAnalytics.avgScore}</div>
            <p className="text-xs text-gray-500">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">High Score Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{scoringAnalytics.highScoreLeads}</div>
            <p className="text-xs text-gray-500">Score ≥ 70</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{scoringAnalytics.conversionRate}%</div>
            <p className="text-xs text-gray-500">Leads to conversions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{scoringRules.length}</div>
            <p className="text-xs text-gray-500">Scoring rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Score Distribution
          </CardTitle>
          <CardDescription>
            Distribution of lead scores across your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(scoringAnalytics.scoreDistribution).map(([range, count]) => (
              <div key={range} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium">{range}</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / scoringAnalytics.totalLeads) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">{count} leads</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Scoring Rules
          </CardTitle>
          <CardDescription>
            Manage automated lead scoring criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Create New Rule */}
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <h4 className="font-medium mb-3">Create New Scoring Rule</h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <Input
                placeholder="Rule name"
                value={newRule.rule_name}
                onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
              />
              
              <Select value={newRule.field_name} onValueChange={(value) => setNewRule({ ...newRule, field_name: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_source">Lead Source</SelectItem>
                  <SelectItem value="company_name">Company</SelectItem>
                  <SelectItem value="training_urgency">Urgency</SelectItem>
                  <SelectItem value="estimated_participant_count">Participants</SelectItem>
                  <SelectItem value="budget_range">Budget</SelectItem>
                </SelectContent>
              </Select>

              <Select value={newRule.operator} onValueChange={(value) => setNewRule({ ...newRule, operator: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Value"
                value={newRule.field_value}
                onChange={(e) => setNewRule({ ...newRule, field_value: e.target.value })}
              />

              <Input
                type="number"
                placeholder="Points"
                value={newRule.score_points}
                onChange={(e) => setNewRule({ ...newRule, score_points: parseInt(e.target.value) || 0 })}
              />

              <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </div>

          {/* Existing Rules */}
          <div className="space-y-3">
            {scoringRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">Priority {rule.priority}</Badge>
                  <div>
                    <div className="font-medium">{rule.rule_name}</div>
                    <div className="text-sm text-gray-600">
                      {rule.field_name} {rule.operator} "{rule.field_value}"
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">+{rule.score_points} pts</Badge>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {scoringRules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scoring rules defined yet</p>
                <p className="text-sm">Create your first rule to enable automated lead scoring</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
