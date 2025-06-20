import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Plus, 
  Calendar,
  Award,
  Users,
  Target,
  AlertCircle
} from 'lucide-react';

interface PerformanceTabProps {
  providerId: string;
  performanceMetrics: any[];
  assignments: any[];
  onPerformanceChange: () => void;
}

export function PerformanceTab({ providerId, performanceMetrics, assignments, onPerformanceChange }: PerformanceTabProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Record performance mutation
  const recordPerformanceMutation = useMutation({
    mutationFn: async (performanceData: {
      teamId: string;
      measurementPeriod: string;
      coursesDelivered: number;
      certificationsIssued: number;
      averageSatisfactionScore: number;
      completionRate: number;
      complianceScore: number;
    }) => {
      const { data, error } = await supabase
        .rpc('record_provider_team_performance', {
          p_provider_id: providerId, // Note: Database functions need updating too
          p_team_id: performanceData.teamId,
          p_measurement_period: performanceData.measurementPeriod,
          p_courses_delivered: performanceData.coursesDelivered,
          p_certifications_issued: performanceData.certificationsIssued,
          p_average_satisfaction_score: performanceData.averageSatisfactionScore,
          p_completion_rate: performanceData.completionRate,
          p_compliance_score: performanceData.complianceScore
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Performance metrics recorded successfully');
      setShowAddDialog(false);
      onPerformanceChange();
    },
    onError: (error: any) => {
      toast.error(`Failed to record performance: ${error.message}`);
    }
  });

  const handleRecordPerformance = (formData: FormData) => {
    const teamId = formData.get('teamId') as string;
    const measurementPeriod = formData.get('measurementPeriod') as string;
    const coursesDelivered = parseInt(formData.get('coursesDelivered') as string) || 0;
    const certificationsIssued = parseInt(formData.get('certificationsIssued') as string) || 0;
    const averageSatisfactionScore = parseFloat(formData.get('averageSatisfactionScore') as string) || 0;
    const completionRate = parseFloat(formData.get('completionRate') as string) || 0;
    const complianceScore = parseFloat(formData.get('complianceScore') as string) || 0;

    if (!teamId || !measurementPeriod) {
      toast.error('Please fill in all required fields');
      return;
    }

    recordPerformanceMutation.mutate({
      teamId,
      measurementPeriod,
      coursesDelivered,
      certificationsIssued,
      averageSatisfactionScore,
      completionRate,
      complianceScore
    });
  };

  // Calculate summary metrics
  const totalCourses = performanceMetrics.reduce((sum, m) => sum + (m.courses_delivered || 0), 0);
  const totalCertifications = performanceMetrics.reduce((sum, m) => sum + (m.certifications_issued || 0), 0);
  const avgSatisfaction = performanceMetrics.length > 0 
    ? performanceMetrics.reduce((sum, m) => sum + (m.average_satisfaction_score || 0), 0) / performanceMetrics.length 
    : 0;
  const avgCompletion = performanceMetrics.length > 0 
    ? performanceMetrics.reduce((sum, m) => sum + (m.completion_rate || 0), 0) / performanceMetrics.length 
    : 0;

  const activeAssignments = assignments.filter(a => a.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Performance Metrics</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage provider performance across teams
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button disabled={activeAssignments.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Record Performance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Performance Metrics</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleRecordPerformance(formData);
            }} className="space-y-4">
              <div>
                <Label htmlFor="teamId">Team</Label>
                <Select name="teamId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAssignments.map((assignment) => (
                      <SelectItem key={assignment.team_id} value={assignment.team_id}>
                        {assignment.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="measurementPeriod">Measurement Period</Label>
                <Input
                  name="measurementPeriod"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coursesDelivered">Courses Delivered</Label>
                  <Input
                    name="coursesDelivered"
                    type="number"
                    min="0"
                    defaultValue="0"
                  />
                </div>
                <div>
                  <Label htmlFor="certificationsIssued">Certifications Issued</Label>
                  <Input
                    name="certificationsIssued"
                    type="number"
                    min="0"
                    defaultValue="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="averageSatisfactionScore">Average Satisfaction Score (1-5)</Label>
                <Input
                  name="averageSatisfactionScore"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  defaultValue="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="completionRate">Completion Rate (%)</Label>
                  <Input
                    name="completionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue="0"
                  />
                </div>
                <div>
                  <Label htmlFor="complianceScore">Compliance Score (%)</Label>
                  <Input
                    name="complianceScore"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue="0"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={recordPerformanceMutation.isPending}
                  className="flex-1"
                >
                  {recordPerformanceMutation.isPending ? 'Recording...' : 'Record Metrics'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certifications</p>
                <p className="text-2xl font-bold">{totalCertifications}</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                <p className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Completion</p>
                <p className="text-2xl font-bold">{avgCompletion.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance History */}
      {performanceMetrics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {new Date(metric.measurement_period).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Team performance metrics
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Courses</p>
                      <p className="font-medium">{metric.courses_delivered || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Certs</p>
                      <p className="font-medium">{metric.certifications_issued || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Satisfaction</p>
                      <p className="font-medium">{(metric.average_satisfaction_score || 0).toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completion</p>
                      <p className="font-medium">{(metric.completion_rate || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Compliance</p>
                      <p className="font-medium">{(metric.compliance_score || 0).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Performance Data</h3>
          <p className="text-sm">
            No performance metrics have been recorded yet.
          </p>
          {activeAssignments.length > 0 && (
            <Button 
              className="mt-4" 
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Performance
            </Button>
          )}
        </div>
      )}
    </div>
  );
}