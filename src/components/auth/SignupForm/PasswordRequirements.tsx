
import { CheckCircle2, XCircle } from 'lucide-react';
import { PasswordStrengthMeter } from '../shared/PasswordStrengthMeter';

interface PasswordRequirement {
  text: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
}

export const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const requirements: PasswordRequirement[] = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "At least one uppercase letter", met: /[A-Z]/.test(password) },
    { text: "At least one lowercase letter", met: /[a-z]/.test(password) },
    { text: "At least one number", met: /[0-9]/.test(password) },
    { text: "At least one special character", met: /[^A-Za-z0-9]/.test(password) },
    { text: "No more than 2 identical characters in a row", met: !/(.)\1{2,}/.test(password) },
    { text: "No common patterns (123, abc)", met: !/123|abc|qwerty|password/i.test(password) }
  ];

  const calculateStrength = (): number => {
    const metRequirements = requirements.filter(req => req.met).length;
    if (password.length === 0) return 0;
    if (metRequirements <= 2) return 0;
    if (metRequirements <= 4) return 1;
    if (metRequirements <= 6) return 2;
    if (metRequirements === 7 && password.length >= 12) return 4;
    return 3;
  };

  return (
    <div className="mt-2 space-y-4">
      <PasswordStrengthMeter strength={calculateStrength()} />
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Password Requirements:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {requirements.map((req, index) => (
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
