
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProgressionPaths } from "@/hooks/useProgressionPaths";
import { useRequirements } from "@/hooks/useRequirements";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Clock, ClipboardCheck, Certificate, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface ProgressTrackerProps {
  targetRole?: string; // If not provided, will use the next role in progression
}

const requirementTypeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  hours: <Clock className="w-4 h-4" />,
  assessment: <ClipboardCheck className="w-4 h-4" />,
  certificate: <Certificate className="w-4 h-4" />
};

const statusIcons: Record<string, React.ReactNode> = {
  not_started: <AlertCircle className="w-4 h-4 text-gray-400" />,
  in_progress: <Clock className="w-4 h-4 text-amber-500" />,
  submitted: <AlertCircle className="w-4 h-4 text-blue-500" />,
  approved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  rejected: <XCircle className="w-4 h-4 text-red-500" />
};

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ targetRole }) => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { paths, loadingPaths } = useProgressionPaths();
  
  // Determine the selected path based on user's current role and target role
  const [selectedPath, setSelectedPath] = React.useState<any>(null);
  
  React.useEffect(() => {
    if (profile && paths) {
      // Find the appropriate path
      const currentRole = profile.role;
      const nextRole = targetRole || getNextRole(currentRole);
      
      const path = paths.find((p: any) => 
        p.from_role === currentRole && p.to_role === nextRole
      );
      
      setSelectedPath(path || null);
    }
  }, [profile, paths, targetRole]);
  
  const { requirements, loadingRequirements } = useRequirements(
    selectedPath?.id
  );
  
  const { progress, loadingProgress, updateProgress } = useUserProgress(
    user?.id,
    selectedPath?.id
  );
  
  const isLoading = profileLoading || loadingPaths || loadingRequirements || loadingProgress;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!selectedPath) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progression Path Not Found</CardTitle>
          <CardDescription>
            There is no defined progression path for your current role.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Calculate progress statistics
  const totalRequirements = requirements?.length || 0;
  const mandatoryRequirements = requirements?.filter((r: any) => r.is_mandatory) || [];
  const approvedRequirements = progress?.filter((p: any) => p.status === 'approved') || [];
  
  const mandatoryCount = mandatoryRequirements.length;
  const completedMandatoryCount = mandatoryRequirements.filter((r: any) => {
    const progressItem = progress?.find((p: any) => p.requirement_id === r.id);
    return progressItem?.status === 'approved';
  }).length;
  
  const totalCompletionPercentage = totalRequirements > 0 
    ? Math.round((approvedRequirements.length / totalRequirements) * 100)
    : 0;
  
  const mandatoryCompletionPercentage = mandatoryCount > 0
    ? Math.round((completedMandatoryCount / mandatoryCount) * 100)
    : 0;
  
  const isEligible = mandatoryCount > 0 && completedMandatoryCount === mandatoryCount;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/20">
        <CardTitle className="flex justify-between items-center">
          <span>Progression Tracker</span>
          <Badge variant={isEligible ? "success" : "outline"}>
            {isEligible ? "Eligible for Promotion" : "In Progress"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {selectedPath.title}: {selectedPath.from_role} → {selectedPath.to_role}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{totalCompletionPercentage}%</span>
            </div>
            <Progress value={totalCompletionPercentage} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Required Items</span>
              <span className="font-medium">{completedMandatoryCount}/{mandatoryCount}</span>
            </div>
            <Progress value={mandatoryCompletionPercentage} className="h-2" />
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Requirements Checklist</h3>
            
            {requirements && requirements.length > 0 ? (
              <div className="space-y-2">
                {requirements.map((req: any) => {
                  const progressItem = progress?.find((p: any) => p.requirement_id === req.id);
                  const status = progressItem?.status || 'not_started';
                  
                  return (
                    <div 
                      key={req.id} 
                      className={`p-3 border rounded-md flex items-center justify-between
                        ${status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-white'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {statusIcons[status]}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {requirementTypeIcons[req.requirement_type] || 
                              requirementTypeIcons.document}
                            {req.title}
                            {req.is_mandatory && (
                              <Badge variant="outline" className="text-xs font-normal">
                                Required
                              </Badge>
                            )}
                          </div>
                          {req.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {req.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={status === 'approved' ? 'success' : 
                                status === 'rejected' ? 'destructive' : 
                                status === 'submitted' ? 'default' : 'outline'}
                      >
                        {status.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">
                No requirements defined for this progression path.
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/10 border-t px-6 py-4">
        <Button 
          disabled={!isEligible} 
          className="w-full"
        >
          {isEligible ? "Request Promotion" : "Complete Required Items"}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Helper function to determine the next role
const getNextRole = (currentRole: string): string => {
  const roleProgression: Record<string, string> = {
    'IT': 'IP',
    'IP': 'IC',
    'IC': 'AP',
    'AP': 'AD',
    'AD': 'SA',
    'SA': 'SA'
  };
  
  return roleProgression[currentRole] || currentRole;
};

export default ProgressTracker;
