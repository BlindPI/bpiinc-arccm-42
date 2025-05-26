
import { useState, useEffect } from "react";
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
  // Ensure confirmations is an array with default values if not provided properly
  const [validConfirmations, setValidConfirmations] = useState<boolean[]>([false, false, false, false, false]);
  
  // Synchronize with passed-in props when they change
  useEffect(() => {
    // Only update if confirmations is a valid array
    if (Array.isArray(confirmations) && confirmations.length === 5) {
      setValidConfirmations(confirmations);
    }
  }, [confirmations]);
  
  // Handle changes safely
  const handleConfirmationsChange = (newConfirmations: boolean[]) => {
    setValidConfirmations(newConfirmations);
    setConfirmations(newConfirmations);
  };
  
  return (
    <div className="w-full">
      <BatchValidationChecklist
        confirmations={validConfirmations}
        setConfirmations={handleConfirmationsChange}
        disabled={disabled}
      />
    </div>
  );
}
