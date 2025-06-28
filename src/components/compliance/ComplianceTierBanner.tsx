
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, ArrowUp } from 'lucide-react';

interface ComplianceTierBannerProps {
  tier?: string;
  canAdvance?: boolean;
  completionPercentage?: number;
  onTierSwitch?: () => void;
}

export function ComplianceTierBanner({
  tier,
  canAdvance,
  completionPercentage = 0,
  onTierSwitch
}: ComplianceTierBannerProps) {
  if (!tier) return null;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Crown className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Current Tier:</span>
                <Badge variant={tier === 'robust' ? 'default' : 'secondary'}>
                  {tier}
                </Badge>
              </div>
              <div className="mt-2">
                <Progress value={completionPercentage} className="w-48" />
                <span className="text-sm text-muted-foreground">
                  {completionPercentage}% Complete
                </span>
              </div>
            </div>
          </div>

          {canAdvance && onTierSwitch && (
            <Button onClick={onTierSwitch} size="sm">
              <ArrowUp className="h-4 w-4 mr-2" />
              Advance Tier
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
