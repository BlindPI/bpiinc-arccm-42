import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, Users, FileText, Award } from "lucide-react";
import { ConversionMetrics } from '@/services/analytics/enrollmentAnalyticsService';

interface ConversionFunnelChartProps {
  data?: ConversionMetrics;
}

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No conversion data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    {
      name: 'Total Enrollments',
      value: data.totalEnrollments,
      percentage: 100,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Students who enrolled in courses',
    },
    {
      name: 'Roster Assignments',
      value: data.rostersCreated,
      percentage: data.enrollmentToRoster,
      icon: FileText,
      color: 'bg-green-500',
      description: 'Students added to training rosters',
    },
    {
      name: 'Certificates Issued',
      value: data.certificatesIssued,
      percentage: data.rosterToCertificate,
      icon: Award,
      color: 'bg-purple-500',
      description: 'Students who received certificates',
    },
  ];

  const getDropoffRate = (index: number) => {
    if (index === 0) return 0;
    const current = stages[index].value;
    const previous = stages[index - 1].value;
    return previous > 0 ? ((previous - current) / previous) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track student progression through the enrollment lifecycle
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stages.map((stage, index) => (
              <div key={stage.name} className="space-y-3">
                {/* Stage Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${stage.color} text-white`}>
                      <stage.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">{stage.name}</h3>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stage.value.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {stage.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress value={stage.percentage} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{stage.value} students</span>
                    <span>{stage.percentage.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Drop-off Analysis */}
                {index > 0 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-red-600">
                        {getDropoffRate(index).toFixed(1)}% drop-off
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {(stages[index - 1].value - stage.value).toLocaleString()} students lost
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Strongest Stage</p>
              <p className="text-sm text-blue-600">
                Enrollment to Roster: {data.enrollmentToRoster.toFixed(1)}% conversion rate
              </p>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800">Improvement Opportunity</p>
              <p className="text-sm text-orange-600">
                Roster to Certificate: {data.rosterToCertificate.toFixed(1)}% needs attention
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Overall Performance</p>
              <p className="text-sm text-green-600">
                {data.overallConversion.toFixed(1)}% end-to-end conversion rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">📈 Improve Roster Creation</p>
              <p className="text-sm text-muted-foreground">
                Automate roster building to reduce manual delays
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">🎯 Certificate Processing</p>
              <p className="text-sm text-muted-foreground">
                Streamline certificate generation workflow
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">📊 Monitor Drop-offs</p>
              <p className="text-sm text-muted-foreground">
                Set up alerts for unusual conversion drops
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}