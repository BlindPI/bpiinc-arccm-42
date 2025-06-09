
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueChart } from './RevenueChart';
import { MonthlyRevenueChart } from './MonthlyRevenueChart';
import { RevenueForecasting } from './RevenueForecasting';
import { RevenueBySourceChart } from './RevenueBySourceChart';
import { PipelineAnalyticsDashboard } from './analytics/PipelineAnalyticsDashboard';

export function RevenueMetricsDashboard() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="sources">By Source</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart chartType="line" />
            <MonthlyRevenueChart months={6} />
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <PipelineAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <RevenueForecasting />
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <RevenueBySourceChart />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <RevenueChart chartType="bar" />
            <MonthlyRevenueChart months={12} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
