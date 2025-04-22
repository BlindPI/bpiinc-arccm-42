
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";

interface BatchValidationChecklistProps {
  confirmations: boolean[];
  setConfirmations: (values: boolean[]) => void;
  setIsValidated: (v: boolean) => void;
  disabled?: boolean;
}

const checklist = [
  "I confirm the course duration requirements have been met",
  "I confirm all required content has been completed",
  "I confirm attendance and participation requirements have been met",
  "I confirm all teaching components have been successfully delivered",
];

export function BatchValidationChecklist({
  confirmations,
  setConfirmations,
  setIsValidated,
  disabled = false,
}: BatchValidationChecklistProps) {
  useEffect(() => {
    setIsValidated(confirmations.every(Boolean));
  }, [confirmations, setIsValidated]);

  return (
    <div className="bg-muted/40 border border-muted rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 border-b border-muted pb-2 mb-2">
        <span className="font-medium text-base">Validation Checklist</span>
      </div>
      <div className="space-y-2">
        {checklist.map((text, idx) => (
          <label key={text} className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox
              checked={confirmations[idx]}
              onCheckedChange={() => {
                const updated = confirmations.slice();
                updated[idx] = !updated[idx];
                setConfirmations(updated);
              }}
              disabled={disabled}
              className={
                !confirmations[idx]
                  ? "border-red-500 data-[state=checked]:bg-green-500"
                  : "border-green-500 bg-green-50"
              }
            />
            <span
              className={
                confirmations[idx]
                  ? "text-green-700"
                  : "text-gray-900"
              }
            >
              {text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

