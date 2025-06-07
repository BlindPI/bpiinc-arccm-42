
// Export all monitoring services
export { systemHealthService } from './systemHealthService';
export { realTimeMetricsService } from './realTimeMetricsService';
export { ExportReportService } from './exportReportService';
export { alertManagementService } from './alertManagementService';

// Export types
export type {
  SystemHealthMetrics,
  SystemAlert,
  PerformanceMetric
} from './systemHealthService';

export type {
  RealTimeMetric,
  MetricSubscription,
  MetricAggregation
} from './realTimeMetricsService';

export type {
  Alert,
  AlertRule,
  NotificationChannel,
  AlertSubscription
} from './alertManagementService';

// Export additional types for ReportGenerationDashboard
export type ReportConfig = {
  id: string;
  name: string;
  type: string;
  schedule?: string;
  enabled: boolean;
};

export type ExportJob = {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: string;
};
