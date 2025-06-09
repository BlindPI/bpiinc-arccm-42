
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock } from 'lucide-react';

interface WorkflowSLATrackerProps {
  slaMetrics: any[];
}

export function WorkflowSLATracker({ slaMetrics }: WorkflowSLATrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          SLA Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{slaMetrics.length}</div>
              <div className="text-sm text-muted-foreground">SLA Breaches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {slaMetrics.filter(m => m.escalation_level === 1).length}
              </div>
              <div className="text-sm text-muted-foreground">Level 1 Escalations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {slaMetrics.filter(m => m.escalation_level > 1).length}
              </div>
              <div className="text-sm text-muted-foreground">Critical Escalations</div>
            </div>
          </div>

          {slaMetrics.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Recent SLA Breaches</h4>
              {slaMetrics.slice(0, 3).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <h5 className="font-medium">
                      {metric.workflow_instances?.instance_name}
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Breach count: {metric.breach_count}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    Level {metric.escalation_level}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
