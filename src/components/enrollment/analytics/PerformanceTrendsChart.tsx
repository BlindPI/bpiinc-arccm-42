import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, BarChart } from "lucide-react";

interface TrendData {
  date: string;
  enrollments: number;
  rosters: number;
  certificates: number;
}

interface PerformanceTrendsChartProps {
  data?: TrendData[];
}

export function PerformanceTrendsChart({ data }: PerformanceTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No trend data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate weekly averages
  const weeklyData = [];
  for (let i = 0; i < data.length; i += 7) {
    const week = data.slice(i, i + 7);
    const weekAvg = {
      week: Math.floor(i / 7) + 1,
      enrollments: week.reduce((sum, d) => sum + d.enrollments, 0) / week.length,
      rosters: week.reduce((sum, d) => sum + d.rosters, 0) / week.length,
      certificates: week.reduce((sum, d) => sum + d.certificates, 0) / week.length,
    };
    weeklyData.push(weekAvg);
  }

  // Calculate trends
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const recent = values.slice(-7).reduce((sum, v) => sum + v, 0) / 7;
    const previous = values.slice(-14, -7).reduce((sum, v) => sum + v, 0) / 7;
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };

  const enrollmentTrend = calculateTrend(data.map(d => d.enrollments));
  const rosterTrend = calculateTrend(data.map(d => d.rosters));
  const certificateTrend = calculateTrend(data.map(d => d.certificates));

  const getTrendBadge = (trend: number, label: string) => {
    const isPositive = trend > 0;
    return (
      <Badge variant={isPositive ? "default" : "secondary"} className="gap-1">
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {label} {Math.abs(trend).toFixed(1)}%
      </Badge>
    );
  };

  // Simple chart data for visual representation
  const maxValue = Math.max(...data.map(d => Math.max(d.enrollments, d.rosters, d.certificates)));

  return (
    <div className="space-y-6">
      {/* Trend Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollment Trend</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data[data.length - 1]?.enrollments || 0}
            </div>
            <div className="mt-2">
              {getTrendBadge(enrollmentTrend, '')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. previous week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roster Creation</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data[data.length - 1]?.rosters || 0}
            </div>
            <div className="mt-2">
              {getTrendBadge(rosterTrend, '')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. previous week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data[data.length - 1]?.certificates || 0}
            </div>
            <div className="mt-2">
              {getTrendBadge(certificateTrend, '')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. previous week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Chart Representation */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Performance Trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            Daily activity across the enrollment lifecycle
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple bar chart visualization */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Enrollments</span>
                  <span className="text-sm text-muted-foreground">
                    Avg: {(data.reduce((sum, d) => sum + d.enrollments, 0) / data.length).toFixed(1)}/day
                  </span>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {data.slice(-30).map((day, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 min-w-[4px] rounded-t"
                      style={{
                        height: `${(day.enrollments / maxValue) * 100}%`,
                        opacity: 0.6 + (day.enrollments / maxValue) * 0.4,
                      }}
                      title={`${day.date}: ${day.enrollments} enrollments`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Rosters Created</span>
                  <span className="text-sm text-muted-foreground">
                    Avg: {(data.reduce((sum, d) => sum + d.rosters, 0) / data.length).toFixed(1)}/day
                  </span>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {data.slice(-30).map((day, index) => (
                    <div
                      key={index}
                      className="bg-green-500 min-w-[4px] rounded-t"
                      style={{
                        height: `${(day.rosters / maxValue) * 100}%`,
                        opacity: 0.6 + (day.rosters / maxValue) * 0.4,
                      }}
                      title={`${day.date}: ${day.rosters} rosters`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Certificates Issued</span>
                  <span className="text-sm text-muted-foreground">
                    Avg: {(data.reduce((sum, d) => sum + d.certificates, 0) / data.length).toFixed(1)}/day
                  </span>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {data.slice(-30).map((day, index) => (
                    <div
                      key={index}
                      className="bg-purple-500 min-w-[4px] rounded-t"
                      style={{
                        height: `${(day.certificates / maxValue) * 100}%`,
                        opacity: 0.6 + (day.certificates / maxValue) * 0.4,
                      }}
                      title={`${day.date}: ${day.certificates} certificates`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Peak Performance Days</h4>
              {data
                .map((day, index) => ({ ...day, index }))
                .sort((a, b) => b.enrollments - a.enrollments)
                .slice(0, 5)
                .map((day, rank) => (
                  <div key={day.index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <Badge variant="outline">
                      {day.enrollments} enrollments
                    </Badge>
                  </div>
                ))}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Conversion Insights</h4>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Best Conversion Day</p>
                  <p className="text-sm text-blue-600">
                    {data.reduce((best, day) => 
                      (day.certificates / Math.max(day.enrollments, 1)) > (best.certificates / Math.max(best.enrollments, 1)) ? day : best
                    ).date}
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Most Productive</p>
                  <p className="text-sm text-green-600">
                    {data.reduce((best, day) => day.rosters > best.rosters ? day : best).date}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}