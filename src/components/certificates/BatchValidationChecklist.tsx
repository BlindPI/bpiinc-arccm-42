
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BatchValidationChecklistProps {
  confirmations: boolean[];
  setConfirmations: React.Dispatch<React.SetStateAction<boolean[]>>;
  setIsValidated?: (validated: boolean) => void;
  disabled?: boolean;
  hasCourseMismatches?: boolean; // New prop to indicate course mismatches
  courseMismatchCount?: number; // New prop for mismatch count
}

export function BatchValidationChecklist({
  confirmations,
  setConfirmations,
  setIsValidated,
  disabled = false,
  hasCourseMismatches = false,
  courseMismatchCount = 0
}: BatchValidationChecklistProps) {
  const [internalConfirmations, setInternalConfirmations] = useState<boolean[]>([false, false, false, false, false]);
  
  useEffect(() => {
    if (Array.isArray(confirmations) && confirmations.length === 5) {
      setInternalConfirmations(confirmations);
    }
  }, [confirmations]);
  
  useEffect(() => {
    if (setIsValidated) {
      // CRITICAL: Cannot validate if there are course mismatches
      const allConfirmed = internalConfirmations.every(Boolean);
      const canValidate = allConfirmed && !hasCourseMismatches;
      setIsValidated(canValidate);
    }
  }, [internalConfirmations, setIsValidated, hasCourseMismatches]);
  
  const toggleConfirmation = (index: number, checked: boolean) => {
    const newConfirmations = [...internalConfirmations];
    newConfirmations[index] = checked;
    setInternalConfirmations(newConfirmations);
    setConfirmations(newConfirmations);
  };
  
  return (
    <div className="space-y-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      {/* Critical Course Mismatch Warning */}
      {hasCourseMismatches && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>CRITICAL: Course Mismatches Detected</strong>
            <br />
            {courseMismatchCount} row(s) have course mismatches that must be resolved before submission.
            <br />
            <span className="text-xs mt-1 block">
              Example: BLS CPR courses do not include First Aid. If your data specifies both First Aid and CPR levels, 
              you need a course that provides both certifications.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3 text-secondary flex items-center gap-2">
          <span>Validation Checklist</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-blue-500" />
              </TooltipTrigger>
              <TooltipContent className="bg-white p-3 max-w-xs">
                <p className="text-sm">Complete all items before submitting your roster. Course mismatches must be resolved first.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Please confirm that you have completed all necessary verification steps before proceeding with your upload:
        </p>
      </div>

      <div className="space-y-5 divide-y divide-gray-100">
        <div className="flex items-start space-x-3 pb-4">
          <Checkbox 
            id="confirm-course-duration" 
            checked={internalConfirmations[0]} 
            onCheckedChange={checked => toggleConfirmation(0, checked as boolean)} 
            disabled={disabled || hasCourseMismatches}
            className="mt-1 border-blue-300 text-blue-600 focus:ring-blue-200"
          />
          <div className="space-y-1.5">
            <Label htmlFor="confirm-course-duration" className="text-sm font-medium leading-none text-gray-900">
              Course Duration Verification
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I confirm that all course duration information has been validated and accurately reflects the scheduled instructional hours.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 py-4">
          <Checkbox 
            id="confirm-content-completion" 
            checked={internalConfirmations[1]} 
            onCheckedChange={checked => toggleConfirmation(1, checked as boolean)} 
            disabled={disabled || hasCourseMismatches}
            className="mt-1 border-blue-300 text-blue-600 focus:ring-blue-200"
          />
          <div className="space-y-1.5">
            <Label htmlFor="confirm-content-completion" className="text-sm font-medium leading-none text-gray-900">
              Content Completion Confirmation
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I verify that all required course modules, components, and materials have been fully delivered according to curriculum standards.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 py-4">
          <Checkbox 
            id="confirm-attendance" 
            checked={internalConfirmations[2]} 
            onCheckedChange={checked => toggleConfirmation(2, checked as boolean)} 
            disabled={disabled || hasCourseMismatches}
            className="mt-1 border-blue-300 text-blue-600 focus:ring-blue-200"
          />
          <div className="space-y-1.5">
            <Label htmlFor="confirm-attendance" className="text-sm font-medium leading-none text-gray-900">
              Attendance and Participation Records
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I certify that attendance records and participation data have been thoroughly reviewed and accurately maintained for all enrolled students.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 py-4">
          <Checkbox 
            id="confirm-teaching" 
            checked={internalConfirmations[3]} 
            onCheckedChange={checked => toggleConfirmation(3, checked as boolean)} 
            disabled={disabled || hasCourseMismatches}
            className="mt-1 border-blue-300 text-blue-600 focus:ring-blue-200"
          />
          <div className="space-y-1.5">
            <Label htmlFor="confirm-teaching" className="text-sm font-medium leading-none text-gray-900">
              Teaching Delivery Confirmation
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I attest that proper instructional delivery has been completed in accordance with program requirements and is fully documented.
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3 pt-4">
          <Checkbox 
            id="confirm-certificate-generation" 
            checked={internalConfirmations[4]} 
            onCheckedChange={checked => toggleConfirmation(4, checked as boolean)} 
            disabled={disabled || hasCourseMismatches}
            className="mt-1 border-blue-300 text-blue-600 focus:ring-blue-200"
          />
          <div className="space-y-1.5">
            <Label htmlFor="confirm-certificate-generation" className="text-sm font-medium leading-none text-gray-900">
              Course Matching Verification & Certificate Generation
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I confirm that all course matching has been verified as correct and acknowledge that certificate generation will proceed for validated entries only.
            </p>
          </div>
        </div>
      </div>

      <div className={`text-xs mt-6 italic px-4 py-3 rounded-lg border ${
        hasCourseMismatches 
          ? 'text-red-700 bg-red-50 border-red-200'
          : 'text-gray-500 bg-blue-50/50 border-blue-100'
      }`}>
        {hasCourseMismatches ? (
          <>
            <strong>Submission Blocked:</strong> Course mismatches must be resolved before proceeding.
            <br />
            Please review the course matching errors above and ensure your data matches available courses.
          </>
        ) : (
          'By proceeding with this upload, you confirm the accuracy of all submitted information and authorize the automatic processing of student certifications.'
        )}
      </div>
    </div>
  );
}
