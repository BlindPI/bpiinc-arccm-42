
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
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
          Please confirm the following before proceeding with your upload:
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="confirm-1"
            checked={confirmations[0]}
            onCheckedChange={(checked) => toggleConfirmation(0, checked as boolean)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <Label
              htmlFor="confirm-1"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have verified all student names and contact information
            </Label>
            <p className="text-xs text-muted-foreground">
              All students have valid names and email addresses
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="confirm-2"
            checked={confirmations[1]}
            onCheckedChange={(checked) => toggleConfirmation(1, checked as boolean)}
            disabled={disabled}
          />
          <div className="space-y-1 flex items-center gap-2">
            <div>
              <Label
                htmlFor="confirm-2"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have verified First Aid & CPR certification levels
              </Label>
              <p className="text-xs text-muted-foreground">
                Students have accurate certification levels for course matching
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    First Aid levels must be one of: <br/>
                    - Standard First Aid<br/>
                    - Emergency First Aid<br/><br/>
                    
                    CPR levels must be one of:<br/>
                    - CPR A<br/>
                    - CPR A w/AED<br/>
                    - CPR C<br/>
                    - CPR C w/AED<br/>
                    - CPR BLS<br/>
                    - CPR BLS w/AED
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="confirm-3"
            checked={confirmations[2]}
            onCheckedChange={(checked) => toggleConfirmation(2, checked as boolean)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <Label
              htmlFor="confirm-3"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have verified all training hours are correct
            </Label>
            <p className="text-xs text-muted-foreground">
              Course length information is accurate and matches certification requirements
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="confirm-4"
            checked={confirmations[3]}
            onCheckedChange={(checked) => toggleConfirmation(3, checked as boolean)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <Label
              htmlFor="confirm-4"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand that this will generate certificates for all students
            </Label>
            <p className="text-xs text-muted-foreground">
              Certificate requests will be created for all valid entries in the roster
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
