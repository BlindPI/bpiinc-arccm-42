
import { BatchValidationChecklist } from "../BatchValidationChecklist";

interface ValidationSectionProps {
  confirmations: boolean[];
  setConfirmations: (values: boolean[]) => void;
  disabled?: boolean;
}

export function ValidationSection({
  confirmations,
  setConfirmations,
  disabled = false
}: ValidationSectionProps) {
  return (
    <div className="w-full">
      <BatchValidationChecklist
        confirmations={confirmations}
        setConfirmations={setConfirmations}
        disabled={disabled}
      />
    </div>
  );
}
