
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatabaseUserRole } from '@/types/database-roles';

const ROLE_PERMISSIONS: Record<DatabaseUserRole, string[]> = {
  SA: ['manage_users', 'manage_system', 'manage_roles', 'view_all_data', 'system_configuration'],
  AD: ['manage_users', 'manage_teams', 'view_analytics', 'manage_courses', 'approve_requests'],
  AP: ['manage_team_members', 'view_team_analytics', 'create_teams', 'manage_courses'],
  IC: ['teach_courses', 'evaluate_students', 'manage_enrollments', 'view_student_progress'],
  IP: ['teach_courses', 'view_student_progress', 'request_evaluations'],
  IT: ['assist_instruction', 'view_assigned_courses', 'submit_evaluations'],
  IN: ['observe_classes', 'access_training_materials', 'submit_progress_reports'],
  TL: ['manage_team_members', 'view_team_progress', 'assign_tasks', 'coordinate_activities'],
  ST: ['enroll_courses', 'view_progress', 'access_materials', 'submit_assignments']
};

const ROLE_DESCRIPTIONS: Record<DatabaseUserRole, string> = {
  SA: 'Full system administration with complete access to all features and data',
  AD: 'Administrative oversight with user and team management capabilities',
  AP: 'Provider-level access with team and course management for assigned locations',
  IC: 'Certified instructor with full teaching and evaluation privileges',
  IP: 'Provisional instructor with supervised teaching capabilities',
  IT: 'Instructor trainee with assisted teaching under supervision',
  IN: 'New instructor with observation and basic training access',
  TL: 'Team leadership with member coordination and progress oversight',
  ST: 'Student access with course enrollment and progress tracking'
};

interface RolePermissionsSummaryProps {
  userRole: DatabaseUserRole;
}

export const RolePermissionsSummary: React.FC<RolePermissionsSummaryProps> = ({ userRole }) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  const description = ROLE_DESCRIPTIONS[userRole] || 'No description available';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Current Role: {userRole}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Permissions ({permissions.length})</h4>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission, index) => (
              <Badge key={index} variant="outline">
                {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
