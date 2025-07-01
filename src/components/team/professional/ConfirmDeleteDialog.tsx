
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Team {
  id: string;
  name: string;
  description?: string;
  status: string;
  team_type?: string;
  performance_score?: number;
  created_at: string;
  locations?: {
    name: string;
    city?: string;
    state?: string;
  };
  member_count: number;
}

interface ConfirmDeleteDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({ 
  team, 
  open, 
  onOpenChange, 
  onConfirm, 
  isLoading 
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Team</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate "{team?.name}"? This will set the team status to inactive.
            {team?.member_count && team.member_count > 0 && (
              <span className="block mt-2 text-orange-600 font-medium">
                This team has {team.member_count} member(s) who will be affected.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Deactivating...' : 'Deactivate Team'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
