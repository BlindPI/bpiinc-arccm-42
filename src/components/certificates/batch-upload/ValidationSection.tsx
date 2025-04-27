
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
    <div className="w-full">
      <BatchValidationChecklist
        confirmations={confirmations}
        setConfirmations={setConfirmations}
        setIsValidated={setIsValidated}
        disabled={disabled}
      />
    </div>
  );
}
