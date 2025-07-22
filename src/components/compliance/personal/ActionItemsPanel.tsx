import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Calendar,
  FileText,
  User,
  ArrowRight
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';

export function ActionItemsPanel() {
  const { state, markActionComplete } = useComplianceDashboard();
  const { complianceActions } = state.data;

  // Filter active actions (open or in progress)
  const activeActions = complianceActions.filter(action => 
    action.status === 'open' || action.status === 'in_progress'
  );

  // Sort by priority and due date
  const sortedActions = activeActions.sort((a, b) => {
    // Priority order: critical > high > medium > low
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by due date
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isOverdue = (dateString: string) => {
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  const handleCompleteAction = async (actionId: string) => {
    await markActionComplete(actionId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Action Items
          {activeActions.length > 0 && (
            <Badge variant="destructive">
              {activeActions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedActions.length > 0 ? (
          <div className="space-y-4">
            {sortedActions.map((action) => (
              <div 
                key={action.id} 
                className={`p-4 border rounded-lg transition-colors ${
                  isOverdue(action.due_date) 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        variant="outline"
                        className={getPriorityColor(action.priority)}
                      >
                        {getPriorityIcon(action.priority)}
                        {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                      </Badge>
                      
                      <Badge variant="outline">
                        {action.status === 'in_progress' ? (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Open
                          </>
                        )}
                      </Badge>

                      {isOverdue(action.due_date) && (
                        <Badge variant="destructive">
                          Overdue
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-medium text-gray-900 mb-2">
                      {action.title}
                    </h4>

                    {action.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {action.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className={`flex items-center gap-1 ${isOverdue(action.due_date) ? 'text-red-600 font-medium' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        Due: {formatDate(action.due_date)}
                        {isOverdue(action.due_date) && ' (Overdue)'}
                      </span>
                      
                      {action.compliance_metrics && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {action.compliance_metrics.name}
                        </span>
                      )}

                      {action.assigned_by && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Assigned by system
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleCompleteAction(action.id)}
                      className="whitespace-nowrap"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">You don't have any pending action items.</p>
          </div>
        )}

        {/* Quick Stats */}
        {activeActions.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {activeActions.filter(a => isOverdue(a.due_date)).length}
                </div>
                <div className="text-xs text-gray-500">Overdue</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  {activeActions.filter(a => a.priority === 'critical' || a.priority === 'high').length}
                </div>
                <div className="text-xs text-gray-500">High Priority</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}