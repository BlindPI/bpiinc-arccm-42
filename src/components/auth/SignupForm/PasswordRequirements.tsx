
import { CheckCircle2, XCircle } from 'lucide-react';
import { PasswordStrengthMeter } from '../shared/PasswordStrengthMeter';

interface PasswordRequirementsProps {
  requirements: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export const PasswordRequirements = ({ requirements }: PasswordRequirementsProps) => {
  const requirementsList = [
    { text: "At least 8 characters", met: requirements.hasMinLength },
    { text: "At least one uppercase letter", met: requirements.hasUppercase },
    { text: "At least one lowercase letter", met: requirements.hasLowercase },
    { text: "At least one number", met: requirements.hasNumber },
    { text: "At least one special character", met: requirements.hasSpecialChar },
  ];

  const calculateStrength = (): number => {
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    if (metRequirements <= 1) return 0;
    if (metRequirements <= 2) return 1;
    if (metRequirements <= 3) return 2;
    if (metRequirements <= 4) return 3;
    return 4;
  };

  return (
    <div className="mt-2 space-y-4 animate-in fade-in duration-200">
      <PasswordStrengthMeter strength={calculateStrength()} />
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Password Requirements:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {requirementsList.map((req, index) => (
            <div key={index} className="flex items-center gap-2">
              {req.met ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-300" />
              )}
              <span className={req.met ? "text-gray-700" : "text-gray-500"}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
