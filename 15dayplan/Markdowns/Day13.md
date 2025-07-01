
Day 13: Implement Data Visualization and Reporting
13.1 Create ComplianceReportGenerator Service
// File: src/services/compliance/complianceReportGenerator.ts

export class ComplianceReportGenerator {
  static async generateUserComplianceReport(
    userId: string,
    options: ReportOptions = {}
  ): Promise<ReportResult> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Get compliance data
      const { data: metrics } = await supabase
        .from('user_compliance_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Get requirement records
      const { data: records } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_requirements(
            id, name, category, requirement_type, points_value
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      // Get activity log
      const { data: activities } = await supabase
        .from('compliance_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(options.activityLimit || 50);
      
      // Generate report data
      const reportData: ComplianceReport = {
        user: {
          id: userId,
          name: profile.display_name,
          email: profile.email,
          role: profile.role,
          tier: profile.compliance_tier
        },
        generatedAt: new Date().toISOString(),
        metrics: {
          overallCompletion: metrics?.overall_percentage || 0,
          totalRequirements: metrics?.total || 0,
          completedRequirements: metrics?.completed || 0,
          inProgressRequirements: metrics?.in_progress || 0,
          totalPoints: metrics?.total_points || 0,
          mandatoryCompliance: metrics?.mandatory_complete 
            ? (metrics.mandatory_complete / metrics.mandatory_total) * 100 
            : 0
        },
        requirements: records.map(record => ({
          id: record.requirement_id,
          name: record.compliance_requirements.name,
          category: record.compliance_requirements.category,
          type: record.compliance_requirements.requirement_type,
          status: record.status,
          points: record.compliance_requirements.points_value,
          submittedAt: record.submitted_at,
          reviewedAt: record.reviewed_at
        })),
        activities: activities.map(activity => ({
          timestamp: activity.created_at,
          action: activity.action,
          requirementName: activity.metadata?.requirementName,
          status: activity.metadata?.newStatus,
          points: activity.metadata?.points
        })),
        categories: this.calculateCategoryBreakdown(records)
      };
      
      // Generate PDF or return JSON
      if (options.format === 'pdf') {
        const pdfBuffer = await this.generatePDFReport(reportData);
        
        // Create report record
        await supabase
          .from('compliance_reports')
          .insert({
            user_id: userId,
            report_type: 'compliance_summary',
            report_format: 'pdf',
            generated_at: reportData.generatedAt,
            metadata: {
              overallCompletion: reportData.metrics.overallCompletion,
              totalRequirements: reportData.metrics.totalRequirements
            }
          });
        
        return {
          success: true,
          format: 'pdf',
          data: pdfBuffer,
          fileName: `compliance_report_${profile.display_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
        };
      } else {
        // Create report record for JSON
        await supabase
          .from('compliance_reports')
          .insert({
            user_id: userId,
            report_type: 'compliance_summary',
            report_format: 'json',
            generated_at: reportData.generatedAt,
            metadata: {
              overallCompletion: reportData.metrics.overallCompletion,
              totalRequirements: reportData.metrics.totalRequirements
            }
          });
        
        return {
          success: true,
          format: 'json',
          data: reportData,
          fileName: `compliance_report_${profile.display_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`
        };
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }
  
  // Calculate breakdown by category
  private static calculateCategoryBreakdown(records: any[]): CategoryBreakdown[] {
    const categories: Record<string, CategoryBreakdown> = {};
    
    records.forEach(record => {
      const category = record.compliance_requirements.category;
      
      if (!categories[category]) {
        categories[category] = {
          name: category,
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          percentage: 0
        };
      }
      
      categories[category].total++;
      
      if (record.status === 'approved') {
        categories[category].completed++;
      } else if (record.status === 'in_progress' || record.status === 'submitted') {
        categories[category].inProgress++;
      } else {
        categories[category].pending++;
      }
    });
    
    // Calculate percentages
    Object.values(categories).forEach(category => {
      category.percentage = category.total > 0 
        ? Math.round((category.completed / category.total) * 100) 
        : 0;
    });
    
    return Object.values(categories);
  }
  
  // Generate PDF report using PDF generation library
  private static async generatePDFReport(reportData: ComplianceReport): Promise<Buffer> {
    try {
      // This would typically use a PDF generation library like PDFKit or a service
      // For simplicity, this is a placeholder
      const pdf = new PDFDocument();
      const buffers: Buffer[] = [];
      
      pdf.on('data', buffers.push.bind(buffers));
      
      // Add report content
      pdf.fontSize(24).text('Compliance Report', { align: 'center' });
      pdf.moveDown();
      
      pdf.fontSize(14).text(`User: ${reportData.user.name} (${reportData.user.role})`);
      pdf.fontSize(12).text(`Tier: ${reportData.user.tier}`);
      pdf.fontSize(12).text(`Generated: ${format(new Date(reportData.generatedAt), 'PPP')}`);
      
      pdf.moveDown();
      
      // Overall metrics
      pdf.fontSize(16).text('Overall Compliance', { underline: true });
      pdf.moveDown(0.5);
      pdf.fontSize(12).text(`Overall Completion: ${reportData.metrics.overallCompletion}%`);
      pdf.fontSize(12).text(`Total Requirements: ${reportData.metrics.totalRequirements}`);
      pdf.fontSize(12).text(`Completed: ${reportData.metrics.completedRequirements}`);
      pdf.fontSize(12).text(`In Progress: ${reportData.metrics.inProgressRequirements}`);
      pdf.fontSize(12).text(`Total Points: ${reportData.metrics.totalPoints}`);
      
      pdf.moveDown();
      
      // Category breakdown
      pdf.fontSize(16).text('Category Breakdown', { underline: true });
      pdf.moveDown(0.5);
      
      reportData.categories.forEach(category => {
        pdf.fontSize(14).text(category.name);
        pdf.fontSize(12).text(`Progress: ${category.percentage}% (${category.completed}/${category.total})`);
        pdf.moveDown(0.5);
      });
      
      pdf.moveDown();
      
      // Recent activity
      pdf.fontSize(16).text('Recent Activity', { underline: true });
      pdf.moveDown(0.5);
      
      reportData.activities.slice(0, 10).forEach(activity => {
        pdf.fontSize(12).text(`${format(new Date(activity.timestamp), 'PP')}: ${activity.action} - ${activity.requirementName || 'N/A'}`);
      });
      
      pdf.end();
      
      return Buffer.concat(buffers);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }
}

typescript



13.2 Create Compliance Analytics Dashboard
// File: src/components/compliance/ComplianceAnalyticsDashboard.tsx

interface ComplianceAnalyticsDashboardProps {
  userId: string;
  role: string;
  tier: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

export function ComplianceAnalyticsDashboard({
  userId,
  role,
  tier,
  timeRange = 'month'
}: ComplianceAnalyticsDashboardProps) {
  const [selectedChart, setSelectedChart] = useState<string>('progress');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPredictions, setShowPredictions] = useState<boolean>(true);
  
  // Load analytics data
  const { data: metrics, isLoading: metricsLoading } = useComplianceMetrics(userId);
  const { data: activities } = useComplianceActivities(userId, timeRange);
  const { data: projections } = useComplianceProjections(userId);
  const { data: requirements } = useComplianceRequirements(userId, role, tier);
  
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['compliance-analytics', userId, timeRange],
    queryFn: () => ComplianceAnalyticsService.getUserAnalytics(userId, timeRange),
    enabled: !!userId && !!timeRange
  });
  
  // Calculate category data
  const categoryData = useMemo(() => {
    if (!requirements) return [];
    
    const categories: Record<string, CategoryData> = {};
    
    requirements.forEach(req => {
      if (!categories[req.category]) {
        categories[req.category] = {
          name: req.category,
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0
        };
      }
      
      categories[req.category].total++;
      
      if (req.status === 'approved') {
        categories[req.category].completed++;
      } else if (req.status === 'in_progress' || req.status === 'submitted') {
        categories[req.category].inProgress++;
      } else {
        categories[req.category].pending++;
      }
    });
    
    return Object.values(categories);
  }, [requirements]);
  
  // Calculate time series data
  const timeSeriesData = useMemo(() => {
    if (!activities) return [];
    
    const dates = groupActivitiesByDate(activities);
    return Object.entries(dates).map(([date, value]) => ({
      date,
      completed: value.completed || 0,
      submitted: value.submitted || 0,
      started: value.started || 0
    }));
  }, [activities]);
  
  // Handle report generation
  const handleGenerateReport = async () => {
    try {
      const result = await ComplianceReportGenerator.generateUserComplianceReport(userId, {
        format: 'pdf',
        timeRange,
        includeActivities: true
      });
      
      if (result.success && result.format === 'pdf') {
        // Create download link
        const blob = new Blob([result.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Report generated successfully');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };
  
  // Render loading state
  if (metricsLoading || analyticsLoading) {
    return <AnalyticsDashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Compliance Analytics</h2>
          <p className="text-muted-foreground">
            Track your compliance progress and performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={handleGenerateReport}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Compliance"
          value={metrics?.overall_percentage || 0}
          format="percentage"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          trend={calculateTrend(analyticsData?.trends?.overall_completion)}
          trendValue={analyticsData?.trends?.overall_completion?.change}
        />
        
        <MetricCard
          title="Requirements Complete"
          value={`${metrics?.completed || 0}/${metrics?.total || 0}`}
          format="fraction"
          icon={<ClipboardCheck className="h-6 w-6 text-blue-600" />}
          trend={calculateTrend(analyticsData?.trends?.completed_requirements)}
          trendValue={analyticsData?.trends?.completed_requirements?.change}
        />
        
        <MetricCard
          title="Compliance Points"
          value={metrics?.total_points || 0}
          format="number"
          icon={<Award className="h-6 w-6 text-purple-600" />}
          trend={calculateTrend(analyticsData?.trends?.points_earned)}
          trendValue={analyticsData?.trends?.points_earned?.change}
        />
        
        <MetricCard
          title="Time to Complete"
          value={projections?.estimatedDays || 'N/A'}
          format="text"
          suffix="days"
          icon={<CalendarClock className="h-6 w-6 text-orange-600" />}
          subtext={projections?.projectedDate ? formatDate(projections.projectedDate) : ''}
        />
      </div>
      
      {/* Chart Selection Tabs */}
      <Tabs
        value={selectedChart}
        onValueChange={setSelectedChart}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 bg-white rounded-lg border p-6">
          <TabsContent value="progress" className="h-80">
            <ComplianceProgressChart
              overallPercentage={metrics?.overall_percentage || 0}
              categoryData={categoryData}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </TabsContent>
          
          <TabsContent value="categories" className="h-80">
            <CategoryBreakdownChart
              categories={categoryData}
              onCategorySelect={setSelectedCategory}
            />
          </TabsContent>
          
          <TabsContent value="timeline" className="h-80">
            <TimeSeriesChart
              data={timeSeriesData}
              timeRange={timeRange}
              showPredictions={showPredictions}
              predictions={projections?.dailyProjections}
            />
          </TabsContent>
          
          <TabsContent value="completion" className="h-80">
            <CompletionPredictionChart
              currentCompletion={metrics?.overall_percentage || 0}
              projections={projections?.weeklyProjections}
              targetDate={projections?.targetDate}
              showPredictions={showPredictions}
            />
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="show-predictions" className="cursor-pointer">
            Show Predictions
          </Label>
          <Switch
            id="show-predictions"
            checked={showPredictions}
            onCheckedChange={setShowPredictions}
          />
        </div>
        
        {selectedChart === 'categories' && (
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryData.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Activity Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            activities={activities?.slice(0, 5) || []}
            emptyMessage="No recent activity"
          />
        </CardContent>
      </Card>
      
      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Compliance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.insights?.map((insight, index) => (
              <Alert
                key={index}
                variant={getInsightVariant(insight.type)}
                className="flex items-start"
              >
                <div className="mr-2 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="space-y-1">
                  <AlertTitle>{insight.title}</AlertTitle>
                  <AlertDescription>{insight.message}</AlertDescription>
                  {insight.action && (
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => handleInsightAction(insight.action)}
                    >
                      {insight.action.label}
                    </Button>
                  )}
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components and functions
function ComplianceProgressChart({
  overallPercentage,
  categoryData,
  selectedCategory,
  onCategorySelect
}: {
  overallPercentage: number;
  categoryData: CategoryData[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}) {
  // Chart implementation with recharts
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="30%"
          outerRadius="90%"
          data={
            selectedCategory === 'all'
              ? [{ name: 'Overall', value: overallPercentage }]
              : categoryData
                  .filter(c => c.name === selectedCategory)
                  .map(c => ({
                    name: c.name,
                    value: c.total > 0 ? (c.completed / c.total) * 100 : 0
                  }))
          }
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            background
            clockWise
            dataKey="value"
            cornerRadius={10}
            fill="#3b82f6"
          />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion']}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

typescript


