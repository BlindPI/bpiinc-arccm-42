// Unified notification components (recommended)
export { 
  UnifiedNotificationBell, 
  CertificateNotificationBell, 
  GeneralNotificationBell 
} from './UnifiedNotificationBell';

// Core notification components
export { NotificationCenter } from './NotificationCenter';
export { NotificationList } from './NotificationList';
export { NotificationPreferencesPanel } from './NotificationPreferencesPanel';

// Admin/testing components
export { NotificationTester } from './NotificationTester';
export { NotificationQueueMonitor } from './NotificationQueueMonitor';

// Legacy components (deprecated - use UnifiedNotificationBell instead)
/** @deprecated Use CertificateNotificationBell or UnifiedNotificationBell instead */
export { SimpleCertificateNotificationBell } from './SimpleCertificateNotificationBell';
/** @deprecated Use GeneralNotificationBell or UnifiedNotificationBell instead */
export { NotificationBell } from './NotificationBell';