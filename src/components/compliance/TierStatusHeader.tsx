// File: src/components/compliance/TierStatusHeader.tsx

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ArrowUpCircle, Award, Clock, AlertTriangle } from 'lucide-react';
import { UIComplianceTierInfo } from '@/services/compliance/complianceTierService';

interface TierStatusHeaderProps {
  tierInfo: UIComplianceTierInfo;
  onOpenTierSwitch?: () => void;
}

export function TierStatusHeader({ tierInfo, onOpenTierSwitch }: TierStatusHeaderProps) {
  if (!tierInfo) {
    return <TierStatusSkeleton />;
  }

  const { 
    tier, 
    role, 
    template_name,
    description,
    completion_percentage, 
    completed_requirements, 
    requirements_count,
    can_advance_tier,
    advancement_blocked_reason,
    next_requirement
  } = tierInfo;

  // Get tier description based on role and tier
  const getTierDescription = (tier: string, role: string) => {
    if (tier === 'basic') {
      return `Essential compliance requirements for ${getRoleLabel(role)} role`;
    } else {
      return `Comprehensive compliance pathway for ${getRoleLabel(role)} role`;
    }
  };

  // Get full role label
  const getRoleLabel = (roleCode: string) => {
    const roles = {
      'IT': 'Instructor Trainee',
      'IP': 'Instructor Provisional',
      'IC': 'Instructor Certified',
      'AP': 'Authorized Provider'
    };
    return roles[roleCode as keyof typeof roles] || roleCode;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant={tier === 'basic' ? 'default' : 'secondary'}
              className="px-3 py-1 text-sm"
            >
              {tier === 'basic' ? 'Essential Tier' : 'Comprehensive Tier'}
            </Badge>
            <Badge variant="outline">{getRoleLabel(role)}</Badge>
          </div>
          
          <h2 className="text-xl font-bold">{template_name}</h2>
          <p className="text-sm text-muted-foreground">{description || getTierDescription(tier, role)}</p>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Completion:</span>
            <span className="text-lg font-bold">{completion_percentage}%</span>
            <span className="text-sm text-muted-foreground">
              ({completed_requirements}/{requirements_count})
            </span>
          </div>
          
          <div className="w-full md:w-64">
            <Progress 
              value={completion_percentage} 
              className="h-2"
              // Color based on progress
              indicatorClassName={
                completion_percentage >= 80 ? 'bg-green-600' :
                completion_percentage >= 50 ? 'bg-amber-500' :
                'bg-blue-600'
              }
            />
          </div>
          
          {tier === 'basic' && (
            <div className="flex items-center gap-2 mt-2">
              {can_advance_tier ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1.5"
                  onClick={onOpenTierSwitch}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Advance to Comprehensive
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{advancement_blocked_reason || 'Complete more requirements to advance'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Next requirement section */}
      {next_requirement && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Next requirement:</span>
            <span>{next_requirement.name}</span>
            {next_requirement.due_date && (
              <span className="text-muted-foreground">
                (Due: {new Date(next_requirement.due_date).toLocaleDateString()})
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function TierStatusSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-7 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-2 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </Card>
  );
}