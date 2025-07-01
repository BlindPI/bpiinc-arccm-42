
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgressionAutomationService } from '@/services/progression/progressionAutomationService';
import { toast } from 'sonner';
import { safeUserRole, type UserRole } from '@/types/supabase-schema';

interface ProgressionDashboardProps {
  userId: string;
}

export const ProgressionDashboard: React.FC<ProgressionDashboardProps> = ({ userId }) => {
  const queryClient = useQueryClient();

  const { data: progressionReport, isLoading } = useQuery({
    queryKey: ['progression-report', userId],
    queryFn: () => ProgressionAutomationService.generateProgressionReport(userId)
  });

  const { mutate: triggerProgression } = useMutation({
    mutationFn: ({ targetRole }: { targetRole: string }) =>
      ProgressionAutomationService.triggerAutomatedProgression(userId, safeUserRole(targetRole)),
    onSuccess: () => {
      toast.success('Progression initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['progression-report', userId] });
    },
    onError: (error: any) => {
      toast.error(`Progression failed: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progressionReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Progression Data</h3>
          <p className="text-gray-500">Unable to load progression information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progression Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Role</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {progressionReport.currentRole}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-500">
                  {progressionReport.completedRequirements.length} / {progressionReport.completedRequirements.length + progressionReport.pendingRequirements.length} requirements
                </span>
              </div>
              <Progress 
                value={(progressionReport.completedRequirements.length / (progressionReport.completedRequirements.length + progressionReport.pendingRequirements.length)) * 100} 
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Progressions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Role Progressions</CardTitle>
        </CardHeader>
        <CardContent>
          {progressionReport.availableProgressions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No progression paths available for your current role.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {progressionReport.availableProgressions.map((progression) => (
                <div
                  key={progression.targetRole}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{progression.title}</h3>
                      <p className="text-sm text-gray-600">{progression.description}</p>
                    </div>
                    <Button
                      onClick={() => triggerProgression({ targetRole: progression.targetRole })}
                      variant="outline"
                      size="sm"
                    >
                      Apply for Progression
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {progression.estimatedTimeToComplete}
                    </div>
                    <Badge variant={progression.autoEligible ? "default" : "secondary"}>
                      {progression.autoEligible ? "Auto-eligible" : "Review required"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requirements Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressionReport.pendingRequirements.map((requirement, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {requirement.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <h4 className="font-medium">{requirement.name}</h4>
                    <p className="text-sm text-gray-600">
                      {requirement.type.charAt(0).toUpperCase() + requirement.type.slice(1)} requirement
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">{requirement.progress}%</div>
                  <Progress value={requirement.progress} className="w-20" />
                </div>
              </div>
            ))}
            
            {progressionReport.pendingRequirements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>All requirements completed!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {progressionReport.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {progressionReport.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressionDashboard;
