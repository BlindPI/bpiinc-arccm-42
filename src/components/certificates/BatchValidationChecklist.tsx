
import { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Info } from "lucide-react";

interface BatchValidationChecklistProps {
  confirmations: boolean[];
  setConfirmations: React.Dispatch<React.SetStateAction<boolean[]>>;
  setIsValidated: (validated: boolean) => void;
  disabled?: boolean;
}

export function BatchValidationChecklist({
  confirmations,
  setConfirmations,
  setIsValidated,
  disabled = false
}: BatchValidationChecklistProps) {
  useEffect(() => {
    const allConfirmed = confirmations.every(Boolean);
    setIsValidated(allConfirmed);
  }, [confirmations, setIsValidated]);

  const toggleConfirmation = (index: number, checked: boolean) => {
    const newConfirmations = [...confirmations];
    newConfirmations[index] = checked;
    setConfirmations(newConfirmations);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-2">Validation Checklist</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Please confirm that you have completed all necessary verification steps before proceeding with your upload:
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="confirm-course-duration"
            checked={confirmations[0]}
            onCheckedChange={(checked) => toggleConfirmation(0, checked as boolean)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <Label
              htmlFor="confirm-course-duration"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Course Duration Verification
            </Label>
            <p className="text-xs text-muted-foreground">
              Confirm all course duration information is validated and accurately reflects scheduled instructional hours
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="confirm-content-completion"
            checked={confirmations[1]}
            onCheckedChange={(checked) => toggleConfirmation(1, checked as boolean)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <Label
              htmlFor="confirm-content-completion"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Content Completion Confirmation
            </Label>
            <p className="text-xs text-muted-foreground">
              Verify all required course modules, components, and materials have been fully delivered
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="confirm-attendance"
            checked={confirmations[2]}
            onCheckedChange={(checked) => toggleConfirmation(2, checked as boolean)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <Label
              htmlFor="confirm-attendance"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Attendance and Participation Records
            </Label>
            <p className="text-xs text-muted-foreground">
              Certify attendance records and participation data have been thoroughly reviewed
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="confirm-teaching"
            checked={confirmations[3]}
            onCheckedChange={(checked) => toggleConfirmation(3, checked as boolean)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <Label
              htmlFor="confirm-teaching"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Teaching Delivery Confirmation
            </Label>
            <p className="text-xs text-muted-foreground">
              Attest that proper instructional delivery is completed and fully documented
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="confirm-certificate-generation"
            checked={confirmations[4]}
            onCheckedChange={(checked) => toggleConfirmation(4, checked as boolean)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <Label
              htmlFor="confirm-certificate-generation"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Certificate Generation Acknowledgment
            </Label>
            <p className="text-xs text-muted-foreground">
              Acknowledge that this will generate certificate requests for all validated students
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mt-4 italic">
        By proceeding with this upload, you confirm the accuracy of all submitted information 
        and authorize the automatic processing of student certifications.
      </div>
    </div>
  );
}
