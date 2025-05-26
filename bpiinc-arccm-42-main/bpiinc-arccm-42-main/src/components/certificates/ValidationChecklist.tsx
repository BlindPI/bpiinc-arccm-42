
import { useState, useEffect } from 'react';
import { Check, CircleCheck, Circle } from 'lucide-react';

interface ValidationChecklistProps {
  name: string;
  email: string;
  selectedCourseId: string;
  issueDate: string;
  expiryDate: string;
  isValidated: boolean;
  setIsValidated?: (v: boolean) => void;
}

export function ValidationChecklist({
  name,
  email,
  selectedCourseId,
  issueDate,
  expiryDate,
  isValidated,
  setIsValidated
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
    const allValid = recipientValid && courseValid && datesValid;
    
    if (setIsValidated) {
      setIsValidated(allValid);
    }
  }, [name, email, selectedCourseId, issueDate, expiryDate, setIsValidated]);

  const allChecksValid = Object.values(checks).every(check => check);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-5 bg-white shadow-sm transition-all">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <Check className="h-5 w-5 text-primary" />
        <h3 className="font-medium text-gray-800">Validation Checklist</h3>
      </div>
      
      <ul className="space-y-3 py-2">
        <li className="flex items-center gap-3 transition-colors">
          {checks.recipient ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-gray-300" />
          }
          <span className={checks.recipient ? "text-gray-900" : "text-gray-400"}>
            Recipient information is complete
          </span>
        </li>
        
        <li className="flex items-center gap-3 transition-colors">
          {checks.course ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-gray-300" />
          }
          <span className={checks.course ? "text-gray-900" : "text-gray-400"}>
            Course selection is valid
          </span>
        </li>
        
        <li className="flex items-center gap-3 transition-colors">
          {checks.dates ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-gray-300" />
          }
          <span className={checks.dates ? "text-gray-900" : "text-gray-400"}>
            Issue and expiry dates are set
          </span>
        </li>
      </ul>
      
      <div className={`flex items-center gap-2 pt-3 border-t border-gray-100 ${allChecksValid ? "text-green-600" : "text-gray-400"} transition-colors`}>
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
