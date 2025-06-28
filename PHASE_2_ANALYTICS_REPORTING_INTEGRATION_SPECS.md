# PHASE 2: ANALYTICS & REPORTING INTEGRATION - TECHNICAL SPECIFICATIONS

**Timeline**: Days 4-6  
**Risk Level**: Medium  
**Priority**: High  
**Components**: 12 Analytics Components  

---

## 🎯 PHASE OBJECTIVES

1. Integrate comprehensive analytics dashboard with real-time capabilities
2. Implement executive reporting suite with automated generation
3. Deploy predictive analytics for compliance risk assessment
4. Create cross-role performance monitoring and comparison tools

---

## 📋 COMPONENT INTEGRATION DETAILS

### Core Analytics Components

#### 1. Enhanced Compliance Analytics Dashboard
```typescript
// @/components/admin/analytics/EnhancedComplianceAnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { ComplianceAnalyticsDashboard } from '@/components/analytics/ComplianceAnalyticsDashboard';
import { enterpriseAnalyticsService } from '@/services/analytics/enterpriseAnalyticsService';
import { realTimeAnalyticsService } from '@/services/analytics/realTimeAnalyticsService';
import { teamScopedAnalyticsService } from '@/services/analytics/teamScopedAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EnhancedAnalyticsProps {
  adminRole: 'SA' | 'AD';
  oversightLevel: 'full' | 'limited';
}

export const EnhancedComplianceAnalyticsDashboard: React.FC<EnhancedAnalyticsProps> = ({
  adminRole,
  oversightLevel
}) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState({});
  const [crossRoleAnalytics, setCrossRoleAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Load comprehensive analytics data
        const [
          complianceAnalytics,
          realTimeData,
          crossRoleData,
          predictiveAnalytics
        ] = await Promise.all([
          enterpriseAnalyticsService.getComplianceAnalytics(),
          realTimeAnalyticsService.getRealTimeMetrics(),
          teamScopedAnalyticsService.getCrossRoleAnalytics(),
          enterpriseAnalyticsService.getPredictiveAnalytics()
        ]);

        setAnalyticsData({
          compliance: complianceAnalytics,
          predictive: predictiveAnalytics
        });
        setRealTimeMetrics(realTimeData);
        setCrossRoleAnalytics(crossRoleData);
        
      } catch (error) {
        console.error('Failed to load analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();

    // Set up real-time subscriptions
    const realTimeSubscription = realTimeAnalyticsService.subscribeToMetrics(
      (newMetrics) => {
        setRealTimeMetrics(prevMetrics => ({
          ...prevMetrics,
          ...newMetrics
        }));
      }
    );

    return () => {
      realTimeSubscription.unsubscribe();
    };
  }, []);

  const exportAnalyticsReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const exportData = {
        generatedAt: new Date().toISOString(),
        adminRole,
        analyticsData,
        realTimeMetrics,
        crossRoleAnalytics
      };

      await enterpriseAnalyticsService.exportAnalyticsReport(exportData, format);
      toast.success(`Analytics report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export analytics report');
    }
  };

  if (loading) {
    return <AnalyticsDashboardSkeleton />;
  }

  return (
    <div className="enhanced-compliance-analytics">
      <div className="analytics-header">
        <h2>Enterprise Compliance Analytics</h2>
        <div className="analytics-actions">
          <Button onClick={() => exportAnalyticsReport('pdf')}>
            Export PDF
          </Button>
          <Button onClick={() => exportAnalyticsReport('excel')}>
            Export Excel
          </Button>
          <Button onClick={() => exportAnalyticsReport('csv')}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="analytics-grid">
        <Card className="real-time-metrics">
          <CardHeader>
            <CardTitle>Real-Time Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <RealTimeMetricsDisplay metrics={realTimeMetrics} />
          </CardContent>
        </Card>

        <Card className="cross-role-analytics">
          <CardHeader>
            <CardTitle>Cross-Role Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <CrossRoleAnalyticsDisplay data={crossRoleAnalytics} />
          </CardContent>
        </Card>

        <Card className="predictive-analytics">
          <CardHeader>
            <CardTitle>Predictive Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <PredictiveAnalyticsDisplay data={analyticsData?.predictive} />
          </CardContent>
        </Card>

        <Card className="compliance-trends">
          <CardHeader>
            <CardTitle>Compliance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ComplianceTrendsChart data={analyticsData?.compliance} />
          </CardContent>
        </Card>
      </div>

      <ComplianceAnalyticsDashboard
        data={analyticsData?.compliance}
        adminMode={true}
        realTimeUpdates={true}
      />
    </div>
  );
};
```

#### 2. Team KPI Dashboard Integration
```typescript
// @/components/admin/analytics/EnhancedTeamKPIDashboard.tsx
import React, { useState, useEffect } from 'react';
import { TeamKPIDashboard } from '@/components/dashboard/widgets/TeamKPIDashboard';
import { realTeamAnalyticsService } from '@/services/team/realTeamAnalyticsService';
import { enterpriseAnalyticsService } from '@/services/analytics/enterpriseAnalyticsService';

export const EnhancedTeamKPIDashboard: React.FC = () => {
  const [kpiData, setKpiData] = useState(null);
  const [crossTeamComparisons, setCrossTeamComparisons] = useState([]);
  const [performanceTrends, setPerformanceTrends] = useState({});

  useEffect(() => {
    const loadKPIData = async () => {
      try {
        const [
          teamKPIs,
          comparisons,
          trends
        ] = await Promise.all([
          realTeamAnalyticsService.getAllTeamKPIs(),
          enterpriseAnalyticsService.getCrossTeamComparisons(),
          enterpriseAnalyticsService.getPerformanceTrends()
        ]);

        setKpiData(teamKPIs);
        setCrossTeamComparisons(comparisons);
        setPerformanceTrends(trends);
      } catch (error) {
        console.error('Failed to load KPI data:', error);
        toast.error('Failed to load team KPI data');
      }
    };

    loadKPIData();
  }, []);

  return (
    <div className="enhanced-team-kpi-dashboard">
      <div className="kpi-overview">
        <h3>Team Performance Overview</h3>
        <div className="kpi-summary-cards">
          {crossTeamComparisons.map(team => (
            <Card key={team.id} className="team-kpi-card">
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <Badge variant={team.performance >= 0.8 ? 'success' : 'warning'}>
                  {(team.performance * 100).toFixed(1)}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="kpi-metrics">
                  <div className="metric">
                    <span>Compliance Rate</span>
                    <span>{(team.complianceRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span>Training Completion</span>
                    <span>{(team.trainingCompletion * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span>Certification Status</span>
                    <span>{team.activeCertifications}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <TeamKPIDashboard
        data={kpiData}
        adminMode={true}
        showComparisons={true}
        trendsData={performanceTrends}
      />
    </div>
  );
};
```

#### 3. Executive Reporting Suite
```typescript
// @/components/admin/reports/ExecutiveReportingSuite.tsx
import React, { useState, useEffect } from 'react';
import { reportingService } from '@/services/analytics/reportingService';
import { complianceReportService } from '@/services/reports/complianceReportService';
import { exportReportService } from '@/services/monitoring/exportReportService';

interface ReportConfig {
  reportType: 'executive' | 'compliance' | 'performance' | 'audit';
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  includeCharts: boolean;
  includeTrends: boolean;
  format: 'pdf' | 'excel' | 'csv';
}

export const ExecutiveReportingSuite: React.FC = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportType: 'executive',
    timeRange: 'month',
    includeCharts: true,
    includeTrends: true,
    format: 'pdf'
  });
  
  const [scheduledReports, setScheduledReports] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const [scheduled, history] = await Promise.all([
          reportingService.getScheduledReports(),
          reportingService.getReportHistory()
        ]);
        
        setScheduledReports(scheduled);
        setReportHistory(history);
      } catch (error) {
        console.error('Failed to load report data:', error);
      }
    };

    loadReportData();
  }, []);

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      
      // Gather comprehensive report data
      const reportData = await complianceReportService.generateComprehensiveReport({
        type: reportConfig.reportType,
        timeRange: reportConfig.timeRange,
        includeAnalytics: true,
        includeCharts: reportConfig.includeCharts,
        includeTrends: reportConfig.includeTrends
      });

      // Export in specified format
      await exportReportService.exportReport(reportData, reportConfig.format);
      
      toast.success('Executive report generated successfully');
      
      // Refresh report history
      const updatedHistory = await reportingService.getReportHistory();
      setReportHistory(updatedHistory);
      
    } catch (error) {
      console.error('Report generation failed:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const scheduleReport = async (schedule: any) => {
    try {
      await reportingService.scheduleReport({
        ...reportConfig,
        schedule
      });
      
      toast.success('Report scheduled successfully');
      
      // Refresh scheduled reports
      const updated = await reportingService.getScheduledReports();
      setScheduledReports(updated);
      
    } catch (error) {
      console.error('Failed to schedule report:', error);
      toast.error('Failed to schedule report');
    }
  };

  return (
    <div className="executive-reporting-suite">
      <Card className="report-builder">
        <CardHeader>
          <CardTitle>Report Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="report-config">
            <div className="config-section">
              <label>Report Type</label>
              <Select
                value={reportConfig.reportType}
                onValueChange={(value) => 
                  setReportConfig(prev => ({ ...prev, reportType: value }))
                }
              >
                <SelectItem value="executive">Executive Summary</SelectItem>
                <SelectItem value="compliance">Compliance Detail</SelectItem>
                <SelectItem value="performance">Performance Analytics</SelectItem>
                <SelectItem value="audit">Audit Report</SelectItem>
              </Select>
            </div>

            <div className="config-section">
              <label>Time Range</label>
              <Select
                value={reportConfig.timeRange}
                onValueChange={(value) => 
                  setReportConfig(prev => ({ ...prev, timeRange: value }))
                }
              >
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="quarter">Past Quarter</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
              </Select>
            </div>

            <div className="config-options">
              <Checkbox
                checked={reportConfig.includeCharts}
                onCheckedChange={(checked) =>
                  setReportConfig(prev => ({ ...prev, includeCharts: checked }))
                }
              >
                Include Charts & Visualizations
              </Checkbox>
              
              <Checkbox
                checked={reportConfig.includeTrends}
                onCheckedChange={(checked) =>
                  setReportConfig(prev => ({ ...prev, includeTrends: checked }))
                }
              >
                Include Trend Analysis
              </Checkbox>
            </div>

            <div className="config-section">
              <label>Export Format</label>
              <RadioGroup
                value={reportConfig.format}
                onValueChange={(value) =>
                  setReportConfig(prev => ({ ...prev, format: value }))
                }
              >
                <div className="radio-item">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf">PDF</Label>
                </div>
                <div className="radio-item">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel">Excel</Label>
                </div>
                <div className="radio-item">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">CSV</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="report-actions">
              <Button
                onClick={generateReport}
                disabled={isGenerating}
                className="generate-button"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
              
              <ReportScheduler
                onSchedule={scheduleReport}
                reportConfig={reportConfig}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="reports-management">
        <Card className="scheduled-reports">
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduledReportsList reports={scheduledReports} />
          </CardContent>
        </Card>

        <Card className="report-history">
          <CardHeader>
            <CardTitle>Report History</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportHistoryList reports={reportHistory} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

#### 4. Predictive Analytics Engine
```typescript
// @/components/admin/analytics/PredictiveAnalyticsEngine.tsx
import React, { useState, useEffect } from 'react';
import { enterpriseAnalyticsService } from '@/services/analytics/enterpriseAnalyticsService';
import { trendCalculationService } from '@/services/analytics/trendCalculationService';

export const PredictiveAnalyticsEngine: React.FC = () => {
  const [predictions, setPredictions] = useState(null);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trends, setTrends] = useState({});

  useEffect(() => {
    const loadPredictiveData = async () => {
      try {
        const [
          predictiveData,
          riskData,
          recommendationData,
          trendData
        ] = await Promise.all([
          enterpriseAnalyticsService.getPredictiveAnalytics(),
          enterpriseAnalyticsService.getComplianceRiskAssessment(),
          enterpriseAnalyticsService.getRecommendations(),
          trendCalculationService.calculateComplianceTrends()
        ]);

        setPredictions(predictiveData);
        setRiskAssessments(riskData);
        setRecommendations(recommendationData);
        setTrends(trendData);
      } catch (error) {
        console.error('Failed to load predictive analytics:', error);
        toast.error('Failed to load predictive analytics');
      }
    };

    loadPredictiveData();
  }, []);

  return (
    <div className="predictive-analytics-engine">
      <div className="predictions-overview">
        <Card className="compliance-predictions">
          <CardHeader>
            <CardTitle>Compliance Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prediction-metrics">
              {predictions?.complianceForecasts?.map(forecast => (
                <div key={forecast.category} className="prediction-item">
                  <span className="category">{forecast.category}</span>
                  <div className="forecast-data">
                    <span className="current">{forecast.current}%</span>
                    <span className="arrow">→</span>
                    <span className={`predicted ${forecast.trend}`}>
                      {forecast.predicted}%
                    </span>
                  </div>
                  <Badge variant={forecast.riskLevel}>
                    {forecast.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="risk-assessments">
          <CardHeader>
            <CardTitle>Risk Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="risk-list">
              {riskAssessments.map(risk => (
                <div key={risk.id} className="risk-item">
                  <div className="risk-header">
                    <span className="risk-title">{risk.title}</span>
                    <Badge variant={risk.severity}>
                      {risk.severity}
                    </Badge>
                  </div>
                  <div className="risk-details">
                    <p>{risk.description}</p>
                    <div className="risk-impact">
                      <span>Impact: {risk.impact}</span>
                      <span>Probability: {risk.probability}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="recommendations">
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="recommendations-list">
            {recommendations.map(rec => (
              <div key={rec.id} className="recommendation-item">
                <div className="recommendation-header">
                  <span className="priority">{rec.priority}</span>
                  <span className="title">{rec.title}</span>
                </div>
                <p className="description">{rec.description}</p>
                <div className="recommendation-actions">
                  <Button size="sm" onClick={() => implementRecommendation(rec.id)}>
                    Implement
                  </Button>
                  <Button size="sm" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="trend-analysis">
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendVisualization data={trends} />
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🔧 SERVICE INTEGRATIONS

### Enhanced Analytics Services

#### 1. Enterprise Analytics Service Enhancement
```typescript
// Extensions to existing enterpriseAnalyticsService
import { enterpriseAnalyticsService } from '@/services/analytics/enterpriseAnalyticsService';

// Admin-specific analytics methods
export const adminAnalyticsExtensions = {
  async getComprehensiveAnalytics(): Promise<ComprehensiveAnalytics> {
    const [
      complianceMetrics,
      performanceData,
      trendAnalysis,
      predictiveData
    ] = await Promise.all([
      enterpriseAnalyticsService.getComplianceMetrics(),
      enterpriseAnalyticsService.getPerformanceMetrics(),
      enterpriseAnalyticsService.getTrendAnalysis(),
      enterpriseAnalyticsService.getPredictiveAnalytics()
    ]);

    return {
      compliance: complianceMetrics,
      performance: performanceData,
      trends: trendAnalysis,
      predictions: predictiveData,
      generatedAt: new Date().toISOString()
    };
  },

  async exportAnalyticsReport(data: any, format: 'pdf' | 'excel' | 'csv'): Promise<void> {
    const exportData = {
      title: 'Enterprise Compliance Analytics Report',
      generatedAt: new Date().toISOString(),
      data: data,
      charts: await this.generateChartsData(data)
    };

    switch (format) {
      case 'pdf':
        return await this.exportToPDF(exportData);
      case 'excel':
        return await this.exportToExcel(exportData);
      case 'csv':
        return await this.exportToCSV(exportData);
    }
  },

  async getCrossRoleAnalytics(): Promise<CrossRoleAnalytics> {
    return await enterpriseAnalyticsService.getCrossRolePerformanceAnalysis();
  }
};
```

#### 2. Real-Time Analytics Service Integration
```typescript
// Real-time analytics subscription management
export const realTimeAnalyticsManager = {
  subscriptions: new Map(),

  subscribeToMetrics(callback: (metrics: any) => void): { unsubscribe: () => void } {
    const subscriptionId = Date.now().toString();
    
    const subscription = realTimeAnalyticsService.subscribe('compliance-metrics', (data) => {
      callback(data);
    });

    this.subscriptions.set(subscriptionId, subscription);

    return {
      unsubscribe: () => {
        const sub = this.subscriptions.get(subscriptionId);
        if (sub) {
          sub.unsubscribe();
          this.subscriptions.delete(subscriptionId);
        }
      }
    };
  },

  async getRealTimeOverview(): Promise<RealTimeOverview> {
    return await realTimeAnalyticsService.getSystemOverview();
  }
};
```

---

## 📊 DATABASE ENHANCEMENTS

### Phase 2 Specific Tables

#### Analytics Data Cache
```sql
-- Analytics results cache for performance
CREATE TABLE analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    analytics_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    parameters JSONB DEFAULT '{}',
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report generation tracking
CREATE TABLE report_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    initiated_by UUID REFERENCES profiles(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    file_path TEXT,
    error_message TEXT
);

-- Scheduled reports configuration
CREATE TABLE scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    schedule_config JSONB NOT NULL,
    report_parameters JSONB NOT NULL,
    recipients UUID[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_generated TIMESTAMP WITH TIME ZONE,
    next_generation TIMESTAMP WITH TIME ZONE
);

-- Predictive analytics models
CREATE TABLE predictive_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    model_config JSONB NOT NULL,
    training_data_config JSONB NOT NULL,
    accuracy_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    trained_at TIMESTAMP WITH TIME ZONE,
    last_prediction TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Performance Optimization Indexes
```sql
-- Analytics cache performance
CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_type ON analytics_cache(analytics_type, expires_at);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at) WHERE expires_at > NOW();

-- Report generation tracking
CREATE INDEX idx_report_jobs_status ON report_generation_jobs(status, initiated_by);
CREATE INDEX idx_report_jobs_type ON report_generation_jobs(report_type, started_at);

-- Scheduled reports
CREATE INDEX idx_scheduled_reports_active ON scheduled_reports(is_active, next_generation);
CREATE INDEX idx_scheduled_reports_type ON scheduled_reports(report_type, created_by);

-- Predictive models
CREATE INDEX idx_predictive_models_active ON predictive_models(is_active, model_type);
CREATE INDEX idx_predictive_models_trained ON predictive_models(trained_at DESC);
```

#### Analytics Triggers
```sql
-- Update analytics cache access tracking
CREATE OR REPLACE FUNCTION update_analytics_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.access_count = OLD.access_count + 1;
    NEW.last_accessed = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER analytics_cache_access_trigger
    BEFORE UPDATE ON analytics_cache
    FOR EACH ROW EXECUTE FUNCTION update_analytics_cache_access();

-- Auto-schedule next report generation
CREATE OR REPLACE FUNCTION schedule_next_report()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate next generation time based on schedule
    NEW.next_generation = calculate_next_schedule_time(NEW.schedule_config, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER schedule_next_report_trigger
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW EXECUTE FUNCTION schedule_next_report();
```

---

## 🧪 TESTING REQUIREMENTS

### Component Testing

#### Analytics Dashboard Tests
```typescript
// @/components/admin/analytics/__tests__/EnhancedComplianceAnalyticsDashboard.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { EnhancedComplianceAnalyticsDashboard } from '../EnhancedComplianceAnalyticsDashboard';
import { enterpriseAnalyticsService } from '@/services/analytics/enterpriseAnalyticsService';

jest.mock('@/services/analytics/enterpriseAnalyticsService');

describe('EnhancedComplianceAnalyticsDashboard', () => {
  const mockAnalyticsData = {
    compliance: { overallScore: 85, trends: [] },
    predictive: { risks: [], recommendations: [] }
  };

  beforeEach(() => {
    enterpriseAnalyticsService.getComplianceAnalytics.mockResolvedValue(mockAnalyticsData.compliance);
    enterpriseAnalyticsService.getPredictiveAnalytics.mockResolvedValue(mockAnalyticsData.predictive);
  });

  test('loads and displays analytics data', async () => {
    render(<EnhancedComplianceAnalyticsDashboard adminRole="SA" oversightLevel="full" />);

    await waitFor(() => {
      expect(screen.getByText('Enterprise Compliance Analytics')).toBeInTheDocument();
      expect(screen.getByText('Real-Time Metrics')).toBeInTheDocument();
    });
  });

  test('export functionality works correctly', async () => {
    const mockExport = jest.fn();
    enterpriseAnalyticsService.exportAnalyticsReport = mockExport;

    render(<EnhancedComplianceAnalyticsDashboard adminRole="SA" oversightLevel="full" />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Export PDF'));
    });

    expect(mockExport).toHaveBeenCalledWith(
      expect.objectContaining({
        adminRole: 'SA',
        analyticsData: mockAnalyticsData
      }),
      'pdf'
    );
  });

  test('real-time updates work correctly', async () => {
    const mockSubscribe = jest.fn((callback) => {
      // Simulate real-time update
      setTimeout(() => callback({ activeUsers: 150 }), 100);
      return { unsubscribe: jest.fn() };
    });

    realTimeAnalyticsService.subscribeToMetrics = mockSubscribe;

    render(<EnhancedComplianceAnalyticsDashboard adminRole="SA" oversightLevel="full" />);

    await waitFor(() => {
      expect(screen.getByText(/150/)).toBeInTheDocument();
    });
  });
});
```

#### Reporting Suite Tests
```typescript
// @/components/admin/reports/__tests__/ExecutiveReportingSuite.test.tsx
describe('ExecutiveReportingSuite', () => {
  test('generates reports with correct configuration', async () => {
    const mockGenerate = jest.fn();
    complianceReportService.generateComprehensiveReport = mockGenerate;

    render(<ExecutiveReportingSuite />);

    // Configure report
    fireEvent.click(screen.getByText('Executive Summary'));
    fireEvent.click(screen.getByText('Past Month'));
    
    // Generate report
    fireEvent.click(screen.getByText('Generate Report'));

    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledWith({
        type: 'executive',
        timeRange: 'month',
        includeAnalytics: true,
        includeCharts: true,
        includeTrends: true
      });
    });
  });

  test('schedules reports correctly', async () => {
    const mockSchedule = jest.fn();
    reportingService.scheduleReport = mockSchedule;

    render(<ExecutiveReportingSuite />);

    // Test scheduling functionality
    const scheduleButton = screen.getByText('Schedule Report');
    fireEvent.click(scheduleButton);

    // Verify scheduling dialog and functionality
    await waitFor(() => {
      expect(screen.getByText('Schedule Configuration')).toBeInTheDocument();
    });
  });
});
```

---

## ⚡ PERFORMANCE REQUIREMENTS

### Analytics Performance Benchmarks
- **Dashboard Load Time**: < 3 seconds for full analytics data
- **Real-Time Update Latency**: < 200ms for metric updates
- **Report Generation**: < 30 seconds for standard reports
- **Export Processing**: < 60 seconds for large data exports
- **Cache Hit Rate**: > 80% for frequently accessed analytics

### Memory and Resource Usage
- **Analytics Data Cache**: < 200MB in memory
- **Real-Time Connections**: Support 100+ concurrent analytics subscriptions
- **Report Processing**: < 500MB memory usage during generation
- **Database Query Performance**: < 500ms for complex analytics queries

---

## 🔒 SECURITY CONSIDERATIONS

### Data Access Control
```typescript
// Analytics data access control
export const analyticsAccessControl = {
  async validateAnalyticsAccess(userId: string, analyticsType: string): Promise<boolean> {
    const permissions = await adminComponentPermissions.getUserComponentPermissions(userId);
    
    const analyticsPermission = permissions.find(p => 
      p.component_name === 'ComplianceAnalyticsDashboard'
    );
    
    return analyticsPermission && ['admin', 'full'].includes(analyticsPermission.permission_level);
  },

  async filterAnalyticsData(data: any, userRole: string, oversightLevel: string): Promise<any> {
    // Filter sensitive data based on role and oversight level
    if (oversightLevel === 'limited') {
      return this.filterSensitiveAnalytics(data);
    }
    return data;
  }
};
```

### Report Security
```typescript
// Secure report generation
export const secureReportGeneration = {
  async generateSecureReport(config: ReportConfig, userId: string): Promise<string> {
    // Validate user permissions for report type
    const hasAccess = await this.validateReportAccess(userId, config.reportType);
    if (!hasAccess) {
      throw new Error('Insufficient permissions for report generation');
    }

    // Generate report with audit trail
    const reportId = await this.createReportAuditEntry(userId, config);
    
    try {
      const reportPath = await this.generateReport(config);
      await this.updateReportStatus(reportId, 'completed', reportPath);
      return reportPath;
    } catch (error) {
      await this.updateReportStatus(reportId, 'failed', null, error.message);
      throw error;
    }
  }
};
```

---

## 📋 DELIVERABLES CHECKLIST

### Phase 2 Completion Criteria
- [ ] **EnhancedComplianceAnalyticsDashboard** integrated with real-time capabilities
- [ ] **EnhancedTeamKPIDashboard** showing cross-team comparisons
- [ ] **ExecutiveReportingSuite** generating and scheduling reports
- [ ] **PredictiveAnalyticsEngine** providing risk assessments and recommendations
- [ ] **Real-time analytics subscriptions** functional and performant
- [ ] **Report export functionality** working in PDF, Excel, and CSV formats
- [ ] **Analytics caching system** improving performance
- [ ] **Scheduled reporting** automated and reliable

### Success Metrics
- [ ] Analytics dashboard loads within 3 seconds
- [ ] Real-time updates display within 200ms
- [ ] Report generation completes within 30 seconds
- [ ] Export functions handle large datasets without errors
- [ ] Cache hit rate exceeds 80% for analytics queries
- [ ] Predictive analytics provide actionable insights
- [ ] Scheduled reports generate automatically as configured

### Technical Validation
- [ ] All analytics data comes from real services
- [ ] No mock or placeholder data in production
- [ ] Performance benchmarks met for all analytics components
- [ ] Security controls prevent unauthorized data access
- [ ] Error handling covers all analytics failure scenarios
- [ ] Audit trails capture all report generation activities

This completes the Phase 2 technical specifications for analytics and reporting integration with comprehensive real-time capabilities and production-ready implementation.