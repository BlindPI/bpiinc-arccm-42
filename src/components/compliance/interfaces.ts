
// Standardized interfaces for compliance components

export interface FileUploadRequirementProps {
  requirement: {
    id: string;
    name: string;
    validation_rules?: {
      file_types?: string[];
      max_file_size?: number;
    };
  };
  onUpload: (file: File) => Promise<void>;
  onSave: () => void;
}

export interface FormRequirementProps {
  requirement: {
    id: string;
    name: string;
    description?: string;
    validation_rules?: {
      min_score?: number;
      completion_evidence_required?: boolean;
    };
    form_fields?: any[];
  };
  userId: string; // Added missing userId prop
  onSave: () => void;
}

export interface ExternalLinkRequirementProps {
  requirement: {
    id: string;
    name: string;
    description?: string;
    external_url?: string;
    external_system?: string;
    validation_rules?: {
      min_score?: number;
      completion_evidence_required?: boolean;
    };
  };
  onSubmit?: () => void; // Changed from onComplete to onSubmit
  onSave: () => void;
}

export interface RequirementDetailDrawerProps {
  requirementId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (requirementId: string) => void;
}

// Status badge variant type
export type StatusBadgeVariant = 'default' | 'destructive' | 'success' | 'secondary' | 'outline' | 'warning' | 'info';

export function getStatusBadgeVariant(status: string): StatusBadgeVariant {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'approved':
      return 'success';
    case 'pending':
    case 'in_progress':
      return 'warning';
    case 'rejected':
    case 'failed':
      return 'destructive';
    case 'waived':
      return 'info';
    default:
      return 'secondary';
  }
}
