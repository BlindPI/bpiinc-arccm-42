
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from "lucide-react";

interface BatchValidationChecklistProps {
  confirmations: boolean[];
  setConfirmations: React.Dispatch<React.SetStateAction<boolean[]>>;
  setIsValidated?: (validated: boolean) => void;
  disabled?: boolean;
}

export function BatchValidationChecklist({
  confirmations,
  setConfirmations,
  setIsValidated,
  disabled = false
}: BatchValidationChecklistProps) {
  
  const toggleConfirmation = (index: number, checked: boolean) => {
    const newConfirmations = [...confirmations];
    newConfirmations[index] = checked;
    setConfirmations(newConfirmations);
    
    if (setIsValidated) {
      setIsValidated(newConfirmations.every(Boolean));
    }
  };
  
  return (
    <div className="space-y-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold mb-3 text-secondary flex items-center gap-2">
          <span>Validation Checklist</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-blue-500" />
              </TooltipTrigger>
              <TooltipContent className="bg-white p-3 max-w-xs">
                <p className="text-sm">Complete all items before submitting your roster.</p>
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
            checked={confirmations[0]} 
            onCheckedChange={checked => toggleConfirmation(0, checked as boolean)} 
            disabled={disabled}
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
            checked={confirmations[1]} 
            onCheckedChange={checked => toggleConfirmation(1, checked as boolean)} 
            disabled={disabled}
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
            checked={confirmations[2]} 
            onCheckedChange={checked => toggleConfirmation(2, checked as boolean)} 
            disabled={disabled}
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
            checked={confirmations[3]} 
            onCheckedChange={checked => toggleConfirmation(3, checked as boolean)} 
            disabled={disabled}
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
            checked={confirmations[4]} 
            onCheckedChange={checked => toggleConfirmation(4, checked as boolean)} 
            disabled={disabled}
            className="mt-1 border-blue-300 text-blue-600 focus:ring-blue-200"
          />
          <div className="space-y-1.5">
            <Label htmlFor="confirm-certificate-generation" className="text-sm font-medium leading-none text-gray-900">
              Certificate Generation Acknowledgment
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I acknowledge that upon submission, this process will generate certificate requests for all students with validated credentials in the uploaded roster.
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-6 italic px-4 py-3 bg-blue-50/50 rounded-lg border border-blue-100">
        By proceeding with this upload, you confirm the accuracy of all submitted information 
        and authorize the automatic processing of student certifications.
      </div>
    </div>
  );
}
