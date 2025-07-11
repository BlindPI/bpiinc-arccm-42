// Enhanced Pass/Fail Visual Indicators
// Complete system for score display, status badges, and completion tracking

export { 
  ScoreStatusBadge, 
  CompactStatusIndicator, 
  DetailedStatusBadge 
} from './ScoreStatusBadge';

export { 
  ScoreProgressBar, 
  ScoreBreakdown, 
  ScoreSummaryIndicator 
} from './ScoreProgressBar';

export { 
  CompletionDateDisplay, 
  CompletionIndicator, 
  CompletionTimeline 
} from './CompletionDateDisplay';

// Re-export types for convenience
export type { CertificateCalculatedStatus } from '@/types/supabase-schema';