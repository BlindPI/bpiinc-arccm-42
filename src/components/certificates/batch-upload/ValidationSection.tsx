
import { useState, useEffect } from "react";
import { BatchValidationChecklist } from "../BatchValidationChecklist";

interface ValidationSectionProps {
  confirmations: Record<string, boolean>;
  setConfirmations: (values: Record<string, boolean>) => void;
  disabled?: boolean;
}

export function ValidationSection({
  confirmations,
  setConfirmations,
  disabled = false
}: ValidationSectionProps) {
  // Convert Record<string, boolean> to boolean[] for the checklist component
  const [validConfirmations, setValidConfirmations] = useState<boolean[]>([false, false, false, false, false]);
  
  // Synchronize with passed-in props when they change
  useEffect(() => {
    // Convert the Record to boolean array based on known keys
    const keys = ['dataAccuracy', 'locationConfirmed', 'coursesMatched', 'duplicatesChecked', 'readyToSubmit'];
    const confirmationArray = keys.map(key => confirmations[key] || false);
    setValidConfirmations(confirmationArray);
  }, [confirmations]);
  
  // Handle changes safely - convert boolean[] back to Record<string, boolean>
  const handleConfirmationsChange = (newConfirmations: boolean[]) => {
    setValidConfirmations(newConfirmations);
    
    // Convert back to Record format
    const keys = ['dataAccuracy', 'locationConfirmed', 'coursesMatched', 'duplicatesChecked', 'readyToSubmit'];
    const confirmationRecord: Record<string, boolean> = {};
    keys.forEach((key, index) => {
      confirmationRecord[key] = newConfirmations[index] || false;
    });
    
    setConfirmations(confirmationRecord);
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
