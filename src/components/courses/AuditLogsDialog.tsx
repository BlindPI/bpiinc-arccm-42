
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCourseAuditLogs } from '@/hooks/useCourseAuditLogs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileHistory, User, Calendar, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AuditLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
}

export function AuditLogsDialog({ open, onOpenChange, courseId, courseName }: AuditLogsDialogProps) {
  const { data: auditLogs, isLoading, error } = useCourseAuditLogs(courseId);

  // Helper to display badge for action types
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-green-100 text-green-800">Created</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-800">Updated</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-800">Deleted</Badge>;
      case 'ACTIVATE':
        return <Badge className="bg-emerald-100 text-emerald-800">Activated</Badge>;
      case 'DEACTIVATE':
        return <Badge className="bg-amber-100 text-amber-800">Deactivated</Badge>;
      case 'CREATE_WITH_REASON':
      case 'UPDATE_WITH_REASON':
      case 'DELETE_WITH_REASON':
        return <Badge className="bg-purple-100 text-purple-800">Notes Added</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{action}</Badge>;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-center text-red-500 flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          <p>Failed to load audit logs</p>
        </div>
      );
    }

    if (!auditLogs?.length) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <FileHistory className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No audit logs found for this course</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 py-4">
        {auditLogs.map((log) => (
          <div key={log.id} className="border rounded-lg p-4 bg-muted/20">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                {getActionBadge(log.action)}
                <span className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(log.performed_at), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <User className="h-3 w-3" />
              <span>{log.performer_name}</span>
              <Calendar className="h-3 w-3 ml-2" />
              <span>{format(new Date(log.performed_at), 'PPp')}</span>
            </div>
            
            {log.reason && (
              <div className="mt-2 border-t pt-2">
                <div className="text-xs font-medium mb-1">Reason:</div>
                <div className="text-sm">{log.reason}</div>
              </div>
            )}
            
            {log.changes && (
              <div className="mt-2 text-xs">
                <div className="font-medium mb-1">Changes:</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileHistory className="h-5 w-5 text-primary" />
            Audit History for {courseName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
