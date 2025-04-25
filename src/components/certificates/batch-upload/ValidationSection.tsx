
import { BatchValidationChecklist } from "../BatchValidationChecklist";

interface ValidationSectionProps {
  confirmations: boolean[];
  setConfirmations: (values: boolean[]) => void;
  setIsValidated: (validated: boolean) => void;
  disabled?: boolean;
}

export function ValidationSection({
  confirmations,
  setConfirmations,
  setIsValidated,
  disabled = false
}: ValidationSectionProps) {
  return (
    <div className="bg-white/60 dark:bg-muted/70 rounded-lg shadow border border-muted/70 p-4">
      <BatchValidationChecklist
        confirmations={confirmations}
        setConfirmations={setConfirmations}
        setIsValidated={setIsValidated}
        disabled={disabled}
      />
    </div>
  );
}
