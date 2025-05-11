
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";
import { ArrowRight, Check, X } from "lucide-react";

interface BatchValidationChecklistProps {
  confirmations: boolean[];
  setConfirmations: (values: boolean[]) => void;
  setIsValidated?: (value: boolean) => void;
  disabled?: boolean;
}

export function BatchValidationChecklist({
  confirmations,
  setConfirmations,
  setIsValidated,
  disabled = false
}: BatchValidationChecklistProps) {
  
  useEffect(() => {
    // Update parent component validation status if needed
    if (setIsValidated) {
      setIsValidated(confirmations.every(Boolean));
    }
  }, [confirmations, setIsValidated]);

  const updateConfirmation = (index: number, value: boolean) => {
    if (disabled) return;
    
    const newConfirmations = [...confirmations];
    newConfirmations[index] = value;
    setConfirmations(newConfirmations);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium mb-3">Pre-Upload Checklist</h3>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Checkbox 
              id="check-1" 
              checked={confirmations[0]} 
              onCheckedChange={(checked) => updateConfirmation(0, checked === true)} 
              disabled={disabled}
              className={cn(
                "rounded-full",
                confirmations[0] && "bg-primary border-primary"
              )}
            />
          </div>
          <div>
            <label htmlFor="check-1" className="font-medium cursor-pointer text-sm">
              Data preparation complete
            </label>
            <p className="text-sm text-muted-foreground">
              I have verified that all required fields are included in my data file (Name, Email, Course details).
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Checkbox 
              id="check-2" 
              checked={confirmations[1]} 
              onCheckedChange={(checked) => updateConfirmation(1, checked === true)} 
              disabled={disabled}
              className={cn(
                "rounded-full",
                confirmations[1] && "bg-primary border-primary"
              )}
            />
          </div>
          <div>
            <label htmlFor="check-2" className="font-medium cursor-pointer text-sm">
              Contact information verified
            </label>
            <p className="text-sm text-muted-foreground">
              I have checked that all recipient email addresses and contact information are accurate.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Checkbox 
              id="check-3" 
              checked={confirmations[2]} 
              onCheckedChange={(checked) => updateConfirmation(2, checked === true)} 
              disabled={disabled}
              className={cn(
                "rounded-full",
                confirmations[2] && "bg-primary border-primary"
              )}
            />
          </div>
          <div>
            <label htmlFor="check-3" className="font-medium cursor-pointer text-sm">
              Course assignment confirmed
            </label>
            <p className="text-sm text-muted-foreground">
              I have confirmed that the course(s) assigned to these certificates are correct.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Checkbox 
              id="check-4" 
              checked={confirmations[3]} 
              onCheckedChange={(checked) => updateConfirmation(3, checked === true)} 
              disabled={disabled}
              className={cn(
                "rounded-full",
                confirmations[3] && "bg-primary border-primary"
              )}
            />
          </div>
          <div>
            <label htmlFor="check-4" className="font-medium cursor-pointer text-sm">
              Ready to submit
            </label>
            <p className="text-sm text-muted-foreground">
              I understand that certificates will be created based on this data and recipients will be notified.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-2 border-t">
        <div className="flex items-center gap-2">
          {confirmations.every(Boolean) ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">All items confirmed</span>
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600">Please confirm all items</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
