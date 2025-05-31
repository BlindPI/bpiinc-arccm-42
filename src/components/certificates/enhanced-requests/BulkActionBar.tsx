
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  X, 
  MessageSquare 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BulkActionBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  onApprove,
  onReject,
  onClear
}: BulkActionBarProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(rejectionReason.trim());
      setRejectionReason('');
      setIsRejectDialogOpen(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-primary bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="px-3 py-1">
              {selectedCount} Selected
            </Badge>
            <span className="text-sm text-gray-600">
              Bulk actions available
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onApprove}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve All
            </Button>
            
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Selected Requests</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejection-reason">Rejection Reason</Label>
                    <Input
                      id="rejection-reason"
                      placeholder="Enter reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsRejectDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={!rejectionReason.trim()}
                    >
                      Reject {selectedCount} Request(s)
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Selection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
