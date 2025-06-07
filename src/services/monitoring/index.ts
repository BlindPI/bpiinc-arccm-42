
// Import and re-export the ExportReportService
import { ExportReportService } from './exportReportService';

// Export all monitoring services
export { systemHealthService } from './systemHealthService';
export { realTimeMetricsService } from './realTimeMetricsService';
export { alertManagementService } from './alertManagementService';

// Export the ExportReportService
export { ExportReportService };

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

// Export ReportConfig and ExportJob types from api types
export type { ReportConfig, ExportJob } from '@/types/api';

// Create exportReportService alias for backward compatibility
export const exportReportService = ExportReportService;
