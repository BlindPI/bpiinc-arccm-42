// File: src/components/compliance/TierAdvancementSection.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, ArrowUpCircle, Award, CheckCircle, Lock } from 'lucide-react';
import { Progress } from '../ui/progress';

interface TierAdvancementSectionProps {
  canAdvance: boolean;
  blockedReason?: string;
  completedRequirements?: number;
  totalRequirements?: number;
  onRequestAdvancement: () => void;
}

export function TierAdvancementSection({
  canAdvance,
  blockedReason,
  completedRequirements = 0,
  totalRequirements = 1,
  onRequestAdvancement
}: TierAdvancementSectionProps) {
  const completionPercentage = Math.round((completedRequirements / totalRequirements) * 100);
  
  return (
    <Card className={canAdvance ? 'border-green-200' : 'border-gray-200'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-blue-600" />
              Tier Advancement
            </CardTitle>
            <CardDescription>
              Upgrade from Essential to Comprehensive Tier
            </CardDescription>
          </div>
          
          {canAdvance && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Eligible for Upgrade</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Advancement Progress</span>
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Essential Tier</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Basic compliance requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Core certification components</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Standard requirement tracking</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Comprehensive Tier</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-purple-600 mt-0.5" />
                  <span>Advanced compliance features</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-purple-600 mt-0.5" />
                  <span>Enhanced certification status</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-purple-600 mt-0.5" />
                  <span>Detailed analytics and reporting</span>
                </li>
              </ul>
            </div>
          </div>
          
          {!canAdvance && blockedReason && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Advancement Requirements</h4>
                  <p className="text-sm text-amber-700 mt-1">{blockedReason}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={onRequestAdvancement}
              disabled={!canAdvance}
              className="gap-2"
            >
              {canAdvance ? (
                <>
                  <ArrowUpCircle className="h-4 w-4" />
                  Request Advancement
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Complete Requirements First
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}