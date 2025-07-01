
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressionAutomation } from '@/hooks/useProgressionAutomation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpCircle,
  FileText,
  Award,
  Target
} from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';

export const ProgressionDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  const { user } = useAuth();
  const { 
    progressionReport, 
    loadingReport, 
    triggerProgression 
  } = useProgressionAutomation(userId);

  if (loadingReport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Clock className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!progressionReport) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load progression data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const {
    currentRole,
    availableProgressions,
    completedRequirements,
    pendingRequirements,
    history,
    recommendations
  } = progressionReport;

  const totalRequirements = completedRequirements.length + pendingRequirements.length;
  const completionPercentage = totalRequirements > 0 
    ? Math.round((completedRequirements.length / totalRequirements) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Current Status Overview */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Progression Status - {ROLE_LABELS[currentRole]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedRequirements.length}</div>
              <div className="text-sm text-muted-foreground">Completed Requirements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingRequirements.length}</div>
              <div className="text-sm text-muted-foreground">Pending Requirements</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to next level</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Progressions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Available Role Progressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableProgressions.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No progression paths available at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {availableProgressions.map((progression) => (
                  <div 
                    key={progression.targetRole}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{ROLE_LABELS[progression.targetRole]}</h4>
                        <p className="text-sm text-muted-foreground">
                          Estimated time: {progression.estimatedTimeToComplete}
                        </p>
                      </div>
                      <Badge variant={progression.eligibility?.eligible ? "default" : "secondary"}>
                        {progression.eligibility?.eligible ? "Eligible" : "In Progress"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Readiness Score</span>
                      <span>{progression.eligibility?.score || 0}%</span>
                    </div>
                    <Progress value={progression.eligibility?.score || 0} className="h-2" />
                    
                    <Button
                      onClick={() => triggerProgression.mutate({ targetRole: progression.targetRole })}
                      disabled={!progression.eligibility?.eligible || triggerProgression.isPending}
                      className="w-full"
                      variant={progression.eligibility?.eligible ? "default" : "outline"}
                    >
                      {progression.eligibility?.eligible ? "Request Progression" : "View Requirements"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Requirements Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Completed Requirements */}
              {completedRequirements.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed ({completedRequirements.length})
                  </h4>
                  <div className="space-y-2">
                    {completedRequirements.map((req, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                        <span className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          {req.name}
                        </span>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {req.progress}/{req.required || 100}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Requirements */}
              {pendingRequirements.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    In Progress ({pendingRequirements.length})
                  </h4>
                  <div className="space-y-3">
                    {pendingRequirements.map((req, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            {req.name}
                          </span>
                          <Badge variant="secondary">
                            {req.progress}/{req.required || 100}
                          </Badge>
                        </div>
                        <Progress 
                          value={(req.required || 0) > 0 ? (req.progress / (req.required || 1)) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Progression History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">
                      {ROLE_LABELS[record.from_role]} → {ROLE_LABELS[record.to_role]}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={
                    record.status === 'APPROVED' ? 'default' :
                    record.status === 'REJECTED' ? 'destructive' :
                    'secondary'
                  }>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressionDashboard;
