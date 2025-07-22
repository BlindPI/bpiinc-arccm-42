import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  Zap,
  Target,
  RefreshCw,
  Bell
} from 'lucide-react';
import { ComplianceTierService, ComplianceTierInfo, TierSwitchResult } from '@/services/compliance/complianceTierService';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { TierComparisonMatrix } from '@/components/compliance/views/TierComparisonMatrix';
import { toast } from 'sonner';

interface EnhancedComplianceTierManagerProps {
  userId: string;
  userRole: 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';
  userName: string;
  canManage?: boolean;
  showComparison?: boolean;
}

interface TierProgressMetrics {
  currentProgress: number;
  estimatedCompletionDays: number;
  recentActivity: number;
  trend: 'improving' | 'stable' | 'declining';
}

export function EnhancedComplianceTierManager({ 
  userId, 
  userRole, 
  userName, 
  canManage = false,
  showComparison = true
}: EnhancedComplianceTierManagerProps) {
  const { addNotification } = useComplianceDashboard();
  const [tierInfo, setTierInfo] = useState<ComplianceTierInfo | null>(null);
  const [progressMetrics, setProgressMetrics] = useState<TierProgressMetrics | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadTierInfo();
    const interval = setInterval(loadTierInfo, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const loadTierInfo = async () => {
    try {
      setIsLoading(true);
      const [info, metrics] = await Promise.all([
        ComplianceTierService.getUserComplianceTierInfo(userId),
        calculateProgressMetrics()
      ]);
      setTierInfo(info);
      setProgressMetrics(metrics);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading tier info:', error);
      toast.error('Failed to load compliance tier information');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgressMetrics = async (): Promise<TierProgressMetrics> => {
    // This would typically call a service to calculate real metrics
    // For now, we'll use mock calculations based on completion percentage
    return {
      currentProgress: Math.random() * 20 + 5, // 5-25% recent progress
      estimatedCompletionDays: Math.floor(Math.random() * 14) + 7, // 7-21 days
      recentActivity: Math.floor(Math.random() * 5) + 1, // 1-5 recent activities
      trend: Math.random() > 0.5 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining'
    };
  };

  const handleTierUpgrade = async (newTier: 'basic' | 'robust') => {
    if (!canManage) {
      toast.error('You do not have permission to change compliance tiers');
      return;
    }

    setIsChanging(true);
    try {
      const result: TierSwitchResult = await ComplianceTierService.switchComplianceTier(userId, newTier);
      
      if (result.success) {
        toast.success(result.message);
        
        // Add notification to dashboard
        addNotification({
          type: 'tier_changed',
          title: 'Tier Updated Successfully',
          message: `${userName} has been upgraded to ${newTier} tier with ${result.requirements_added} new requirements`,
          read: false
        });

        // Refresh data
        await loadTierInfo();
        setShowUpgradeDialog(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error changing tier:', error);
      toast.error('Failed to update compliance tier');
    } finally {
      setIsChanging(false);
    }
  };

  const getTierIcon = (tier: 'basic' | 'robust') => {
    return tier === 'basic' ? <FileText className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const getTierColor = (tier: 'basic' | 'robust') => {
    return tier === 'basic' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-green-50 border-green-200 text-green-800';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              Loading compliance information...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tierInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Compliance Tier Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load compliance tier information for this user.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Tier Status Card */}
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1 ${getProgressColor(tierInfo.completion_percentage)}`} />
        
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Compliance Tier - {userName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getTierColor(tierInfo.tier)}>
                {getTierIcon(tierInfo.tier)}
                {tierInfo.tier.charAt(0).toUpperCase() + tierInfo.tier.slice(1)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadTierInfo}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{tierInfo.description}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Completion Progress</span>
                  {progressMetrics && getTrendIcon(progressMetrics.trend)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {tierInfo.completed_requirements} of {tierInfo.total_requirements} requirements
                  {progressMetrics && (
                    <span className="ml-2">• Est. {progressMetrics.estimatedCompletionDays} days to complete</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{tierInfo.completion_percentage}%</div>
                {progressMetrics && (
                  <div className="text-xs text-muted-foreground">
                    +{progressMetrics.currentProgress.toFixed(1)}% recent
                  </div>
                )}
              </div>
            </div>
            
            <Progress 
              value={tierInfo.completion_percentage} 
              className="h-3"
            />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              {progressMetrics && (
                <span>{progressMetrics.recentActivity} recent activities</span>
              )}
            </div>
          </div>

          {/* Status Alert */}
          <Alert className={tierInfo.completion_percentage === 100 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            {tierInfo.completion_percentage === 100 ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-700">
                  <strong>Congratulations!</strong> All requirements have been completed for your current tier.
                  {tierInfo.tier === 'basic' && (
                    <span className="ml-1">Consider upgrading to Robust tier for full certification.</span>
                  )}
                </AlertDescription>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-yellow-700">
                  <strong>{tierInfo.total_requirements - tierInfo.completed_requirements} requirements remaining</strong>
                  {progressMetrics && (
                    <span className="ml-1">• Estimated completion in {progressMetrics.estimatedCompletionDays} days</span>
                  )}
                </AlertDescription>
              </>
            )}
          </Alert>

          {/* Tier Upgrade Section */}
          {canManage && tierInfo.tier === 'basic' && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Upgrade to Robust Tier</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlock full certification capabilities with comprehensive requirements
                  </p>
                </div>
                <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Upgrade Now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Upgrade to Robust Tier</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      <Alert>
                        <Bell className="h-4 w-4" />
                        <AlertDescription>
                          This will upgrade {userName} from Basic to Robust tier, adding comprehensive compliance requirements.
                        </AlertDescription>
                      </Alert>

                      <TierComparisonMatrix
                        currentUserId={userId}
                        currentUserRole={userRole}
                        onTierSelect={handleTierUpgrade}
                        showUpgradeOption={false}
                      />

                      <div className="flex gap-3 pt-4 border-t">
                        <Button 
                          onClick={() => handleTierUpgrade('robust')}
                          disabled={isChanging}
                          className="flex-1"
                        >
                          {isChanging ? (
                            <>
                              <Clock className="h-4 w-4 animate-spin mr-2" />
                              Upgrading...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Confirm Upgrade to Robust
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowUpgradeDialog(false)}
                          className="flex-1"
                          disabled={isChanging}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* Tier Comparison Link */}
          {showComparison && (
            <div className="border-t pt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Compare Tier Requirements
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tier Requirements Comparison</DialogTitle>
                  </DialogHeader>
                  
                  <TierComparisonMatrix
                    currentUserId={userId}
                    currentUserRole={userRole}
                    onTierSelect={canManage ? handleTierUpgrade : undefined}
                    showUpgradeOption={canManage}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Permission Notice */}
          {!canManage && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Only administrators can change compliance tiers. Contact your administrator if you need tier adjustments.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}