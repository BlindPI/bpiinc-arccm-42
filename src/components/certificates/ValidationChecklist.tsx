
import { useState, useEffect } from 'react';
import { Check, CircleCheck, Circle } from 'lucide-react';

interface ValidationChecklistProps {
  name: string;
  email: string;
  selectedCourseId: string;
  issueDate: string;
  expiryDate: string;
  isValidated: boolean;
  onValidationChange: (v: boolean) => void;
}

export function ValidationChecklist({
  name,
  email,
  selectedCourseId,
  issueDate,
  expiryDate,
  isValidated,
  onValidationChange
}: ValidationChecklistProps) {
  const [checks, setChecks] = useState({
    recipient: false,
    course: false,
    dates: false,
  });

  useEffect(() => {
    const recipientValid = name.trim() !== '' && email.trim() !== '';
    const courseValid = selectedCourseId !== '';
    const datesValid = issueDate !== '' && expiryDate !== '';
    
    setChecks({
      recipient: recipientValid,
      course: courseValid,
      dates: datesValid,
    });
    
    // Auto-validate if all checks pass
    onValidationChange(recipientValid && courseValid && datesValid);
  }, [name, email, selectedCourseId, issueDate, expiryDate, onValidationChange]);

  const allChecksValid = Object.values(checks).every(check => check);

  return (
    <div className="space-y-4 border rounded-lg border-muted p-4 bg-muted/20">
      <div className="flex items-center gap-2 pb-2 border-b border-muted">
        <Check className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Validation Checklist</h3>
      </div>
      
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          {checks.recipient ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-muted-foreground" />
          }
          <span className={checks.recipient ? "text-gray-900" : "text-muted-foreground"}>
            Recipient information is complete
          </span>
        </li>
        
        <li className="flex items-center gap-2">
          {checks.course ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-muted-foreground" />
          }
          <span className={checks.course ? "text-gray-900" : "text-muted-foreground"}>
            Course selection is valid
          </span>
        </li>
        
        <li className="flex items-center gap-2">
          {checks.dates ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-muted-foreground" />
          }
          <span className={checks.dates ? "text-gray-900" : "text-muted-foreground"}>
            Issue and expiry dates are set
          </span>
        </li>
      </ul>
      
      <div className={`flex items-center gap-2 pt-2 border-t border-muted ${allChecksValid ? "text-green-600" : "text-muted-foreground"}`}>
        {allChecksValid ? 
          <Check className="h-5 w-5" /> : 
          <Circle className="h-5 w-5" />
        }
        <span className="font-medium">
          {allChecksValid ? "All validation checks passed" : "Complete all required fields"}
        </span>
      </div>
    </div>
  );
}
