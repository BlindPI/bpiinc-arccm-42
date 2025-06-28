
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Dashboard, Shield, TrendingUp } from 'lucide-react';

interface DashboardSidebarProps {
  role?: string;
  tier?: string;
  collapsed: boolean;
  onToggle: () => void;
  activeView: 'overview' | 'compliance' | 'progress';
  onViewChange: (view: 'overview' | 'compliance' | 'progress') => void;
  quickStats?: {
    compliance: number;
    nextDue?: string;
    tier?: string;
  };
}

export function DashboardSidebar({
  role,
  tier,
  collapsed,
  onToggle,
  activeView,
  onViewChange,
  quickStats
}: DashboardSidebarProps) {
  if (collapsed) {
    return (
      <div className="w-16 bg-white border-r flex flex-col items-center py-4">
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Dashboard</h2>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {role && (
          <Badge variant="secondary" className="mb-4">
            {role}
          </Badge>
        )}

        <nav className="space-y-2">
          <Button
            variant={activeView === 'overview' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange('overview')}
          >
            <Dashboard className="h-4 w-4 mr-2" />
            Overview
          </Button>

          <Button
            variant={activeView === 'compliance' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange('compliance')}
          >
            <Shield className="h-4 w-4 mr-2" />
            Compliance
          </Button>

          <Button
            variant={activeView === 'progress' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange('progress')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Progress
          </Button>
        </nav>

        {quickStats && (
          <Card className="mt-4">
            <CardContent className="p-3">
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span>Compliance</span>
                  <span className="font-medium">{quickStats.compliance}%</span>
                </div>
                {quickStats.tier && (
                  <Badge variant="outline" className="text-xs">
                    {quickStats.tier}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
