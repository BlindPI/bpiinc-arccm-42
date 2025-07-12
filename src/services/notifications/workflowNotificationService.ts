
import { supabase } from '@/integrations/supabase/client';
import { NotificationProcessor } from './notificationProcessor';

export interface WorkflowNotification {
  id: string;
  workflowId: string;
  stepId: string;
  recipientId: string;
  type: 'approval_required' | 'status_change' | 'deadline_approaching' | 'workflow_completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export class WorkflowNotificationService {
  static async notifyApprovalRequired(
    workflowId: string,
    stepId: string,
    approverIds: string[],
    workflowTitle: string,
    requesterName: string
  ): Promise<void> {
    const notifications = approverIds.map(approverId => ({
      userId: approverId,
      title: 'Approval Required',
      message: `${requesterName} has submitted "${workflowTitle}" for your approval`,
      type: 'workflow_approval',
      category: 'WORKFLOW',
      priority: 'HIGH' as 'HIGH',
      actionUrl: `/workflows/${workflowId}`,
      sendEmail: true,
      metadata: {
        workflowId,
        stepId,
        workflowTitle,
        requesterName,
        page_path: '/workflows'
      }
    }));

    for (const notification of notifications) {
      await NotificationProcessor.createNotification(notification);
    }
  }

  static async notifyWorkflowStatusChange(
    workflowId: string,
    requesterIds: string[],
    status: string,
    workflowTitle: string,
    changedBy: string
  ): Promise<void> {
    const statusMessages = {
      'approved': 'has been approved',
      'rejected': 'has been rejected',
      'in_review': 'is now under review',
      'completed': 'has been completed'
    };

    const message = statusMessages[status as keyof typeof statusMessages] || 'status has been updated';

    const notifications = requesterIds.map(requesterId => ({
      userId: requesterId,
      title: 'Workflow Status Update',
      message: `Your workflow "${workflowTitle}" ${message} by ${changedBy}`,
      type: 'workflow_update',
      category: 'WORKFLOW',
      priority: (status === 'rejected' ? 'HIGH' : 'NORMAL') as 'HIGH' | 'NORMAL',
      actionUrl: `/workflows/${workflowId}`,
      sendEmail: status === 'approved' || status === 'rejected',
      metadata: {
        workflowId,
        workflowTitle,
        status,
        changedBy,
        page_path: '/workflows'
      }
    }));

    for (const notification of notifications) {
      await NotificationProcessor.createNotification(notification);
    }
  }

  static async notifyDeadlineApproaching(
    workflowId: string,
    recipientIds: string[],
    workflowTitle: string,
    dueDate: string,
    hoursRemaining: number
  ): Promise<void> {
    const urgency = hoursRemaining <= 24 ? 'URGENT' : 'HIGH';
    const timeString = hoursRemaining <= 24 ? `${hoursRemaining} hours` : `${Math.ceil(hoursRemaining / 24)} days`;

    const notifications = recipientIds.map(recipientId => ({
      userId: recipientId,
      title: 'Workflow Deadline Approaching',
      message: `Workflow "${workflowTitle}" is due in ${timeString}`,
      type: 'workflow_deadline',
      category: 'WORKFLOW',
      priority: urgency as 'HIGH' | 'URGENT',
      actionUrl: `/workflows/${workflowId}`,
      sendEmail: true,
      metadata: {
        workflowId,
        workflowTitle,
        dueDate,
        hoursRemaining,
        page_path: '/workflows'
      }
    }));

    for (const notification of notifications) {
      await NotificationProcessor.createNotification(notification);
    }
  }

  static async notifyWorkflowCompleted(
    workflowId: string,
    participantIds: string[],
    workflowTitle: string,
    completedBy: string
  ): Promise<void> {
    const notifications = participantIds.map(participantId => ({
      userId: participantId,
      title: 'Workflow Completed',
      message: `Workflow "${workflowTitle}" has been completed by ${completedBy}`,
      type: 'workflow_completion',
      category: 'WORKFLOW',
      priority: 'NORMAL' as 'NORMAL',
      actionUrl: `/workflows/${workflowId}`,
      sendEmail: false,
      metadata: {
        workflowId,
        workflowTitle,
        completedBy,
        page_path: '/workflows'
      }
    }));

    for (const notification of notifications) {
      await NotificationProcessor.createNotification(notification);
    }
  }

  // Enhanced notification methods for Phase 2
  static async notifyTeamCreationApproval(
    teamId: string,
    teamName: string,
    approverIds: string[],
    requesterName: string,
    locationName: string
  ): Promise<void> {
    const notifications = approverIds.map(approverId => ({
      userId: approverId,
      title: 'Team Creation Approval Required',
      message: `${requesterName} has requested to create team "${teamName}" at ${locationName}`,
      type: 'team_approval',
      category: 'TEAM_MANAGEMENT',
      priority: 'HIGH' as 'HIGH',
      actionUrl: `/teams/${teamId}/approve`,
      sendEmail: true,
      metadata: {
        teamId,
        teamName,
        locationName,
        requesterName,
        page_path: '/teams'
      }
    }));

    for (const notification of notifications) {
      await NotificationProcessor.createNotification(notification);
    }
  }

  static async notifyComplianceAlert(
    providerId: string,
    providerName: string,
    alertType: string,
    alertMessage: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    recipientIds: string[]
  ): Promise<void> {
    const priorityMap = {
      'low': 'NORMAL' as const,
      'medium': 'NORMAL' as const,
      'high': 'HIGH' as const,
      'critical': 'URGENT' as const
    };

    const notifications = recipientIds.map(recipientId => ({
      userId: recipientId,
      title: `Compliance Alert - ${providerName}`,
      message: alertMessage,
      type: 'compliance_alert',
      category: 'COMPLIANCE',
      priority: priorityMap[severity],
      actionUrl: `/providers/${providerId}/compliance`,
      sendEmail: severity === 'high' || severity === 'critical',
      metadata: {
        providerId,
        providerName,
        alertType,
        severity,
        page_path: '/providers'
      }
    }));

    for (const notification of notifications) {
      await NotificationProcessor.createNotification(notification);
    }
  }

  static async scheduleDeadlineReminders(): Promise<void> {
    // Simplified version - removed references to non-existent fields
    // In a real implementation, deadline information would be stored in instance_data JSON
    console.log('Deadline reminders scheduling - placeholder implementation');
    // TODO: Implement with actual deadline fields from instance_data or create proper schema
  }

  // SLA Escalation notifications
  static async notifySLAEscalation(
    workflowId: string,
    workflowTitle: string,
    escalationLevel: number,
    managerIds: string[]
  ): Promise<void> {
    const notifications = managerIds.map(managerId => ({
      userId: managerId,
      title: `SLA Escalation - Level ${escalationLevel}`,
      message: `Workflow "${workflowTitle}" has exceeded SLA and requires immediate attention`,
      type: 'sla_escalation',
      category: 'WORKFLOW',
      priority: 'URGENT' as 'URGENT',
      actionUrl: `/workflows/${workflowId}`,
      sendEmail: true,
      metadata: {
        workflowId,
        workflowTitle,
        escalationLevel,
        page_path: '/workflows'
      }
    }));

    for (const notification of notifications) {
      await NotificationProcessor.createNotification(notification);
    }
  }
}
