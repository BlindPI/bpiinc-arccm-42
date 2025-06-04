import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { crmLeadService } from '@/services/crm';
import { useQuery } from '@tanstack/react-query';

export const LeadScoreDistribution: React.FC = () => {
  const { data: leadScoreData, isLoading, error } = useQuery({
    queryKey: ['crm', 'lead-score-distribution'],
    queryFn: async () => {
      // Get leads with their scores
      const response = await crmLeadService.getLeads({}, 1, 1000);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch lead data');
      }

      const leads = response.data.data;
      
      // Group leads by score ranges
      const scoreRanges = [
        { range: '0-20', min: 0, max: 20, count: 0, label: 'Cold' },
        { range: '21-40', min: 21, max: 40, count: 0, label: 'Warm' },
        { range: '41-60', min: 41, max: 60, count: 0, label: 'Good' },
        { range: '61-80', min: 61, max: 80, count: 0, label: 'Hot' },
        { range: '81-100', min: 81, max: 100, count: 0, label: 'Very Hot' }
      ];

      leads.forEach(lead => {
        const score = lead.lead_score || 0;
        const range = scoreRanges.find(r => score >= r.min && score <= r.max);
        if (range) {
          range.count++;
        }
      });

      return scoreRanges;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getBarColor = (range: string) => {
    switch (range) {
      case '0-20': return 'hsl(var(--destructive))';
      case '21-40': return 'hsl(var(--warning))';
      case '41-60': return 'hsl(var(--secondary))';
      case '61-80': return 'hsl(var(--primary))';
      case '81-100': return 'hsl(var(--success))';
      default: return 'hsl(var(--muted))';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Score Distribution</CardTitle>
          <CardDescription>Distribution of leads by scoring ranges</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Score Distribution</CardTitle>
          <CardDescription>Distribution of leads by scoring ranges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Failed to load lead score data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Score Distribution</CardTitle>
        <CardDescription>Distribution of leads by scoring ranges</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leadScoreData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [value, 'Leads']}
              labelFormatter={(label: string) => {
                const range = leadScoreData?.find(d => d.range === label);
                return `${label} (${range?.label})`;
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};