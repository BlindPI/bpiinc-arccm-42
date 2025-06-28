
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export interface TierSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  targetTier?: string;
  userId?: string;
  userRole?: string;
  onConfirm: (newTier: string, reason: string) => Promise<void>;
}

export function TierSwitchDialog({
  isOpen,
  onClose,
  currentTier,
  targetTier,
  onConfirm
}: TierSwitchDialogProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!targetTier || !reason.trim()) return;
    
    setIsLoading(true);
    try {
      await onConfirm(targetTier, reason);
      setReason('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Switch Compliance Tier</DialogTitle>
          <DialogDescription>
            You are about to switch from {currentTier} tier to {targetTier} tier.
            Please provide a reason for this change.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for tier switch</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you are switching tiers..."
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? 'Switching...' : 'Confirm Switch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
