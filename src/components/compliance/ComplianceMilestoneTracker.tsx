
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserAchievement } from '@/types/analytics';
import { Award, CheckCircle, Trophy } from 'lucide-react';

interface ComplianceMilestoneTrackerProps {
  userId: string;
  achievements?: UserAchievement[];
}

export function ComplianceMilestoneTracker({ userId, achievements = [] }: ComplianceMilestoneTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Compliance Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length > 0 ? (
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <div>
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="default">
                    {achievement.points || 0} pts
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(achievement.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No milestones achieved yet</p>
            <p className="text-sm">Complete compliance requirements to earn achievements</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
