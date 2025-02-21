
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, FileCheck, Ban } from 'lucide-react';

export const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive", icon: React.ReactNode }> = {
    PENDING: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    APPROVED: { variant: "default", icon: <FileCheck className="w-3 h-3" /> },
    REJECTED: { variant: "destructive", icon: <Ban className="w-3 h-3" /> }
  };

  const config = variants[status] || variants.PENDING;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {status}
    </Badge>
  );
};
