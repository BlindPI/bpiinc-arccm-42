import { NotificationType, NotificationMetadata } from './notificationService';

interface NotificationTemplate {
  title: string;
  message: string;
  link?: string;
}

export function getNotificationTemplate(
  type: NotificationType,
  metadata?: NotificationMetadata
): NotificationTemplate {
  switch (type) {
    case 'requirement_assigned':
      return {
        title: 'New Compliance Requirement Assigned',
        message: `You have been assigned a new ${metadata?.requirementName || 'compliance requirement'}.`,
        link: `/compliance/requirements/${metadata?.requirementId}`
      };
      
    case 'requirement_updated':
      return {
        title: 'Requirement Updated',
        message: `The requirement "${metadata?.requirementName}" has been updated.`,
        link: `/compliance/requirements/${metadata?.requirementId}`
      };
      
    case 'submission_approved':
      return {
        title: 'Submission Approved',
        message: `Your submission for "${metadata?.requirementName}" has been approved.`,
        link: `/compliance/submissions/${metadata?.submissionId}`
      };
      
    case 'submission_rejected':
      return {
        title: 'Submission Needs Revision',
        message: `Your submission for "${metadata?.requirementName}" requires revisions.`,
        link: `/compliance/submissions/${metadata?.submissionId}`
      };
      
    case 'tier_switched':
      return {
        title: 'Compliance Tier Changed',
        message: `Your compliance tier has been changed from ${metadata?.fromTier || 'previous tier'} to ${metadata?.toTier || 'new tier'}.`,
        link: '/compliance/dashboard'
      };
      
    case 'comment_added':
      return {
        title: 'New Comment Added',
        message: `${metadata?.commentAuthor || 'Someone'} added a comment to your submission.`,
        link: `/compliance/submissions/${metadata?.submissionId}`
      };
      
    case 'due_date_approaching':
      return {
        title: 'Due Date Approaching',
        message: `The requirement "${metadata?.requirementName}" is due in ${metadata?.daysRemaining || 'a few'} days.`,
        link: `/compliance/requirements/${metadata?.requirementId}`
      };
      
    case 'system_announcement':
      return {
        title: metadata?.title || 'System Announcement',
        message: metadata?.message || 'There is a new system announcement.',
        link: metadata?.link || '/announcements'
      };
      
    default:
      return {
        title: 'New Notification',
        message: 'You have a new notification.',
        link: '/notifications'
      };
  }
}