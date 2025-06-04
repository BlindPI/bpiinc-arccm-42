import React from 'react';
import { CRMPlaceholder } from '@/components/crm/common/CRMPlaceholder';

export const CRMActivitiesPage: React.FC = () => {
  return (
    <CRMPlaceholder
      title="Activities & Tasks"
      description="Activity logging and task management system"
      features={[
        "Comprehensive activity logging (calls, emails, meetings, demos)",
        "Task creation and assignment with due dates",
        "Calendar integration and scheduling",
        "Follow-up reminders and automated task creation",
        "Activity outcome tracking and interest level scoring",
        "Meeting notes and document attachments",
        "Activity timeline and history tracking",
        "Performance analytics and activity reporting"
      ]}
    />
  );
};