
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, Circle, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserAchievement } from '@/types/analytics';

export function ComplianceMilestoneTracker() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .order('achieved_at', { ascending: false });

      if (error) {
        console.error('Error fetching achievements:', error);
        return;
      }

      // Map database structure to interface - no milestone_id needed
      const mappedAchievements = data?.map(achievement => ({
        id: achievement.id,
        user_id: achievement.user_id,
        achievement_name: achievement.achievement_name,
        achievement_description: achievement.achievement_description,
        achievement_type: achievement.achievement_type,
        badge_icon: achievement.badge_icon,
        category: achievement.category,
        tier_level: achievement.tier_level,
        points_awarded: achievement.points_awarded,
        achieved_at: achievement.achieved_at,
        created_at: achievement.created_at,
        updated_at: achievement.updated_at,
        metadata: achievement.metadata
      })) || [];

      setAchievements(mappedAchievements);
    };

    fetchAchievements();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Milestones</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] w-full">
          <div className="space-y-4 p-4">
            {achievements.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Award className="h-6 w-6 mx-auto mb-2" />
                No milestones achieved yet
              </div>
            ) : (
              achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={achievement.badge_icon} alt={achievement.achievement_name} />
                    <AvatarFallback>{achievement.achievement_name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{achievement.achievement_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {achievement.achievement_description}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {achievement.points_awarded} Points
                  </Badge>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
