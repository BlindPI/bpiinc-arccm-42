
import { useState, useEffect } from "react";
import { BatchValidationChecklist } from "../BatchValidationChecklist";

interface ValidationSectionProps {
  confirmations: Record<string, boolean>;
  setConfirmations: (values: Record<string, boolean>) => void;
  disabled?: boolean;
  hasCourseMismatches?: boolean;
  courseMismatchCount?: number;
}

export function ValidationSection({
  confirmations,
  setConfirmations,
  disabled = false,
  hasCourseMismatches = false,
  courseMismatchCount = 0
}: ValidationSectionProps) {
  const [validConfirmations, setValidConfirmations] = useState<boolean[]>([false, false, false, false, false]);
  
  useEffect(() => {
    const keys = ['dataAccuracy', 'locationConfirmed', 'coursesMatched', 'duplicatesChecked', 'readyToSubmit'];
    const confirmationArray = keys.map(key => confirmations[key] || false);
    setValidConfirmations(confirmationArray);
  }, [confirmations]);
  
  const handleConfirmationsChange = (newConfirmations: boolean[]) => {
    setValidConfirmations(newConfirmations);
    
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
        hasCourseMismatches={hasCourseMismatches}
        courseMismatchCount={courseMismatchCount}
      />
    </div>
  );
}
