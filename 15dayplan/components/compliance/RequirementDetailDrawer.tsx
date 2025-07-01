// File: src/components/compliance/RequirementDetailDrawer.tsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequirementDetail, useRequirementHistory } from '../../hooks/useComplianceRequirements';
import { format } from 'date-fns';

// UI Components
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '../ui/drawer';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

// Import submission components
import FileUploadRequirement from './FileUploadRequirement';
import FormRequirement from './FormRequirement';
import ExternalLinkRequirement from './ExternalLinkRequirement';

interface RequirementDetailDrawerProps {
  requirementId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (requirementId: string) => void;
}

export function RequirementDetailDrawer({
  requirementId,
  isOpen,
  onClose,
  onUpdate,
}: RequirementDetailDrawerProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  
  // Fetch requirement details
  const {
    data: requirement,
    isLoading,
    error
  } = useRequirementDetail(requirementId || '', user?.id || '');
  
  // Fetch requirement history
  const { data: history } = useRequirementHistory(requirementId || '', user?.id || '');
  
  // Handle successful submission
  const handleSubmissionSuccess = () => {
    if (requirementId) {
      onUpdate(requirementId);
      setActiveTab('details');
    }
  };
  
  // Render status badge with appropriate color and icon
  const renderStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ReactNode }> = {
      approved: { variant: 'success', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      submitted: { variant: 'info', icon: <Clock className="h-3 w-3 mr-1" /> },
      in_progress: { variant: 'warning', icon: <RefreshCw className="h-3 w-3 mr-1" /> },
      rejected: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
      pending: { variant: 'outline', icon: null },
    };
    
    const statusConfig = variants[status] || variants.pending;
    
    return (
      <Badge variant={statusConfig.variant} className="flex items-center">
        {statusConfig.icon}
        <span>{status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}</span>
      </Badge>
    );
  };
  
  // Determine the submission component based on requirement type
  const renderSubmissionComponent = () => {
    if (!requirement) return null;
    
    switch (requirement.ui_component) {
      case 'file_upload':
        return (
          <FileUploadRequirement
            requirement={requirement}
            onSubmit={handleSubmissionSuccess}
            onSave={() => onUpdate(requirementId!)}
          />
        );
        
      case 'form':
        return (
          <FormRequirement
            requirement={requirement}
            onSubmit={handleSubmissionSuccess}
            onSave={() => onUpdate(requirementId!)}
          />
        );
        
      case 'external_link':
        return (
          <ExternalLinkRequirement
            requirement={requirement}
            onSubmit={handleSubmissionSuccess}
          />
        );
        
      default:
        return (
          <div className="p-6 bg-gray-50 rounded-lg text-center">
            <p className="text-muted-foreground">
              This requirement type is not supported for direct submission.
              Please contact your administrator for assistance.
            </p>
          </div>
        );
    }
  };
  
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            {isLoading ? (
              <span>Loading requirement...</span>
            ) : error ? (
              <span>Error loading requirement</span>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                <span>{requirement?.name}</span>
                {requirement?.status && renderStatusBadge(requirement.status)}
              </div>
            )}
          </DrawerTitle>
          
          {requirement && (
            <DrawerDescription className="mt-2">
              {requirement.description}
            </DrawerDescription>
          )}
        </DrawerHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            <p>Failed to load requirement details.</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : requirement ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="submit" disabled={requirement.status === 'approved'}>
                {requirement.status === 'approved' ? 'Approved' : 'Submit'}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-0">
              <RequirementDetails requirement={requirement} />
            </TabsContent>
            
            <TabsContent value="submit" className="mt-0">
              {renderSubmissionComponent()}
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <RequirementHistory history={history} />
            </TabsContent>
          </Tabs>
        ) : null}
        
        <DrawerFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Requirement details component
function RequirementDetails({ requirement }: { requirement: any }) {
  const dueDate = requirement.due_date 
    ? format(new Date(requirement.due_date), 'PPP')
    : 'No due date';
  
  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      document: 'Documentation',
      training: 'Training',
      certification: 'Certification',
      assessment: 'Assessment',
    };
    
    return types[type] || type;
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500">Type</h3>
          <p className="mt-1">{getTypeLabel(requirement.type)}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500">Category</h3>
          <p className="mt-1 capitalize">{requirement.category}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <div className="mt-1">
            {renderStatusBadge(requirement.status)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
          <p className="mt-1">{dueDate}</p>
        </div>
      </div>
      
      {requirement.submission_data && Object.keys(requirement.submission_data).length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Submission Details</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            {requirement.submission_data.files && requirement.submission_data.files.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Uploaded Files</h4>
                <div className="space-y-2">
                  {requirement.submission_data.files.map((file: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                      <span>{file.name}</span>
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {requirement.submission_data.notes && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">Notes</h4>
                <p className="text-sm p-2 bg-white rounded border">
                  {requirement.submission_data.notes}
                </p>
              </div>
            )}
            
            {requirement.submission_data.submittedAt && (
              <div className="mt-4 text-xs text-gray-500">
                Submitted on {format(new Date(requirement.submission_data.submittedAt), 'PPP p')}
              </div>
            )}
          </div>
        </div>
      )}
      
      {requirement.review_notes && (
        <div>
          <h3 className="text-sm font-medium mb-2">Review Notes</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm">{requirement.review_notes}</p>
            {requirement.reviewed_at && (
              <div className="mt-2 text-xs text-gray-500">
                Reviewed on {format(new Date(requirement.reviewed_at), 'PPP p')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// History component for the requirement
function RequirementHistory({ history }: { history?: any[] }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No history available for this requirement
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Requirement Activity History</h3>
      
      <div className="space-y-3">
        {history.map((event, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-md border">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{event.action}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(event.timestamp), 'PPP p')}
                </p>
              </div>
              {event.status && renderStatusBadge(event.status)}
            </div>
            
            {event.notes && (
              <p className="mt-2 text-sm border-t pt-2">
                {event.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function for rendering status badges
function renderStatusBadge(status: string) {
  const variants: Record<string, { variant: string; icon: React.ReactNode }> = {
    approved: { variant: 'success', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    submitted: { variant: 'info', icon: <Clock className="h-3 w-3 mr-1" /> },
    in_progress: { variant: 'warning', icon: <RefreshCw className="h-3 w-3 mr-1" /> },
    rejected: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    pending: { variant: 'outline', icon: null },
  };
  
  const statusConfig = variants[status] || variants.pending;
  
  return (
    <Badge variant={statusConfig.variant} className="flex items-center">
      {statusConfig.icon}
      <span>{status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}</span>
    </Badge>
  );
}

export default RequirementDetailDrawer;