import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Award, Star, CheckCircle, Share2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { supabase } from '@/integrations/supabase/client';

interface Milestone {
  id: string;
  name: string;
  description: string;
  category: string;
  required_completion_percentage: number;
  points: number;
  badge_icon?: string;
  is_achieved: boolean;
  achieved_at?: string;
  next_requirement?: {
    name: string;
    description: string;
  };
}

interface UserAchievement {
  id: string;
  milestone_id: string;
  achieved_at: string;
  points_earned: number;
}

interface ComplianceMilestoneTrackerProps {
  userId: string;
  role: string;
  tier: string;
  onMilestoneAchieved?: (milestone: Milestone) => void;
}

export function ComplianceMilestoneTracker({
  userId,
  role,
  tier,
  onMilestoneAchieved
}: ComplianceMilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [celebrationMilestone, setCelebrationMilestone] = useState<Milestone | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<any>(null);

  // Load user's compliance data and milestones
  useEffect(() => {
    if (userId && role && tier) {
      loadMilestoneData();
    }
  }, [userId, role, tier]);

  const loadMilestoneData = async () => {
    try {
      setIsLoading(true);

      // Get user's current tier info and progress
      const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);
      setUserProgress(tierInfo);

      // Get user's compliance records
      const records = await ComplianceService.getUserComplianceRecords(userId);
      
      // Calculate milestones based on actual progress
      const calculatedMilestones = calculateMilestones(tierInfo, records);
      setMilestones(calculatedMilestones);

      // Load existing achievements (if any custom achievement system exists)
      await loadUserAchievements();

    } catch (error) {
      console.error('Error loading milestone data:', error);
      toast.error('Failed to load milestone data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMilestones = (tierInfo: any, records: any[]): Milestone[] => {
    if (!tierInfo) return [];

    const completionPercentage = tierInfo.completion_percentage;
    const completedCount = tierInfo.completed_requirements;
    const totalCount = tierInfo.total_requirements;

    const baseMilestones: Milestone[] = [
      {
        id: 'first_requirement',
        name: 'First Steps',
        description: 'Complete your first compliance requirement',
        category: 'Getting Started',
        required_completion_percentage: 1,
        points: 100,
        badge_icon: '🎯',
        is_achieved: completedCount >= 1,
        achieved_at: completedCount >= 1 ? records[0]?.verified_at : undefined
      },
      {
        id: 'quarter_complete',
        name: 'Quarter Mark',
        description: 'Complete 25% of your compliance requirements',
        category: 'Progress',
        required_completion_percentage: 25,
        points: 250,
        badge_icon: '📈',
        is_achieved: completionPercentage >= 25,
        achieved_at: completionPercentage >= 25 ? new Date().toISOString() : undefined
      },
      {
        id: 'halfway_hero',
        name: 'Halfway Hero',
        description: 'Complete 50% of your compliance requirements',
        category: 'Progress',
        required_completion_percentage: 50,
        points: 500,
        badge_icon: '⭐',
        is_achieved: completionPercentage >= 50,
        achieved_at: completionPercentage >= 50 ? new Date().toISOString() : undefined
      },
      {
        id: 'three_quarters',
        name: 'Almost There',
        description: 'Complete 75% of your compliance requirements',
        category: 'Progress',
        required_completion_percentage: 75,
        points: 750,
        badge_icon: '🚀',
        is_achieved: completionPercentage >= 75,
        achieved_at: completionPercentage >= 75 ? new Date().toISOString() : undefined
      },
      {
        id: 'completion_master',
        name: 'Completion Master',
        description: 'Complete 100% of your compliance requirements',
        category: 'Achievement',
        required_completion_percentage: 100,
        points: 1000,
        badge_icon: '🏆',
        is_achieved: completionPercentage >= 100,
        achieved_at: completionPercentage >= 100 ? new Date().toISOString() : undefined
      }
    ];

    // Add tier-specific milestones
    if (tier === 'robust') {
      baseMilestones.push({
        id: 'robust_tier_starter',
        name: 'Robust Tier Starter',
        description: 'Begin your journey in the robust compliance tier',
        category: 'Tier Progress',
        required_completion_percentage: 1,
        points: 150,
        badge_icon: '💪',
        is_achieved: true, // Already in robust tier
        achieved_at: new Date().toISOString()
      });
    }

    // Add role-specific milestones
    if (role === 'IC' || role === 'AP') {
      baseMilestones.push({
        id: 'advanced_role',
        name: 'Advanced Professional',
        description: `Achieve ${role} role status with compliance excellence`,
        category: 'Role Achievement',
        required_completion_percentage: 90,
        points: 800,
        badge_icon: '👑',
        is_achieved: completionPercentage >= 90,
        achieved_at: completionPercentage >= 90 ? new Date().toISOString() : undefined
      });
    }

    // Calculate next requirement for each milestone
    return baseMilestones.map(milestone => ({
      ...milestone,
      next_requirement: milestone.is_achieved ? undefined : {
        name: `Progress to ${milestone.required_completion_percentage}%`,
        description: `Complete ${Math.ceil((milestone.required_completion_percentage * totalCount / 100) - completedCount)} more requirements`
      }
    }));
  };

  const loadUserAchievements = async () => {
    try {
      // Try to load from a custom achievements table, fallback to calculating from progress
      const { data: achievementData, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (!error && achievementData) {
        setAchievements(achievementData);
      }
    } catch (error) {
      // Achievements table may not exist, that's fine
      console.log('No custom achievements table found, using calculated milestones');
    }
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
  };

  const handleShareAchievement = async (milestone: Milestone) => {
    try {
      const shareText = `🎉 I just achieved "${milestone.name}" in my compliance journey! ${milestone.points} points earned! 💪`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Compliance Milestone Achievement',
          text: shareText,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Achievement copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      toast.error('Could not share achievement');
    }
  };

  const totalPointsEarned = milestones
    .filter(m => m.is_achieved)
    .reduce((sum, m) => sum + m.points, 0);

  const nextMilestone = milestones.find(m => !m.is_achieved);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Compliance Milestones
          </CardTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{userProgress?.completion_percentage || 0}% Complete</span>
            <span>{totalPointsEarned} Points Earned</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress 
              value={userProgress?.completion_percentage || 0} 
              className="h-3"
            />
            
            {nextMilestone && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Next Milestone</h4>
                    <p className="text-sm text-blue-700">{nextMilestone.name}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {nextMilestone.next_requirement?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestone Progress Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Your Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                currentProgress={userProgress?.completion_percentage || 0}
                onClick={() => handleMilestoneClick(milestone)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Milestone Details Modal */}
      <Dialog open={!!selectedMilestone} onOpenChange={() => setSelectedMilestone(null)}>
        <DialogContent className="max-w-md">
          {selectedMilestone && (
            <div className="text-center py-4">
              <div className="mb-4">
                <div className={cn(
                  "w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl",
                  selectedMilestone.is_achieved 
                    ? "bg-yellow-500 text-white" 
                    : "bg-gray-200 text-gray-500"
                )}>
                  {selectedMilestone.badge_icon || '🎯'}
                </div>
              </div>
              
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedMilestone.name}
                </DialogTitle>
              </DialogHeader>
              
              <p className="text-muted-foreground mb-4">
                {selectedMilestone.description}
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{selectedMilestone.points} points</span>
                </div>
                <Badge variant={selectedMilestone.is_achieved ? "default" : "secondary"}>
                  {selectedMilestone.category}
                </Badge>
              </div>
              
              {selectedMilestone.is_achieved ? (
                <div className="space-y-3">
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Achieved
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleShareAchievement(selectedMilestone)}
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Badge variant="secondary">
                    Not Yet Achieved
                  </Badge>
                  {selectedMilestone.next_requirement && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Next Steps:</p>
                      <p>{selectedMilestone.next_requirement.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Celebration Modal */}
      <MilestoneCelebrationModal
        milestone={celebrationMilestone}
        isOpen={!!celebrationMilestone}
        onClose={() => setCelebrationMilestone(null)}
        onShareAchievement={handleShareAchievement}
      />
    </div>
  );
}

// Milestone Card Component
function MilestoneCard({
  milestone,
  currentProgress,
  onClick
}: {
  milestone: Milestone;
  currentProgress: number;
  onClick: () => void;
}) {
  const progressTowardsMilestone = Math.min(
    (currentProgress / milestone.required_completion_percentage) * 100,
    100
  );

  return (
    <div
      className={cn(
        "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
        milestone.is_achieved 
          ? "border-green-500 bg-green-50" 
          : "border-gray-200 hover:border-gray-300"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-lg",
            milestone.is_achieved 
              ? "bg-green-500 text-white" 
              : "bg-gray-200 text-gray-500"
          )}>
            {milestone.badge_icon || '🎯'}
          </div>
          <div>
            <h4 className="font-medium">{milestone.name}</h4>
            <p className="text-sm text-muted-foreground">{milestone.description}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3 w-3 text-yellow-500" />
            <span>{milestone.points}</span>
          </div>
          {milestone.is_achieved && (
            <Badge variant="default" className="bg-green-600 text-xs mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Done
            </Badge>
          )}
        </div>
      </div>
      
      {!milestone.is_achieved && (
        <div className="space-y-2">
          <Progress 
            value={progressTowardsMilestone} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressTowardsMilestone)}% toward milestone</span>
            <span>Need {milestone.required_completion_percentage}% total</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Celebration Modal Component
function MilestoneCelebrationModal({
  milestone,
  isOpen,
  onClose,
  onShareAchievement
}: {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
  onShareAchievement: (milestone: Milestone) => void;
}) {
  if (!milestone) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center py-6">
          {/* Celebration Animation */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-bounce">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <div className="mt-4">
              <div className="text-6xl animate-pulse">🎉</div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">
            Milestone Achieved!
          </h2>
          
          <h3 className="text-xl font-semibold mb-3">
            {milestone.name}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            {milestone.description}
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-1 text-yellow-600">
              <Star className="h-5 w-5" />
              <span className="font-medium">+{milestone.points} points</span>
            </div>
            
            <div className="flex items-center gap-1 text-purple-600">
              <Award className="h-5 w-5" />
              <span className="font-medium">New achievement!</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onShareAchievement(milestone)}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button
              onClick={onClose}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}