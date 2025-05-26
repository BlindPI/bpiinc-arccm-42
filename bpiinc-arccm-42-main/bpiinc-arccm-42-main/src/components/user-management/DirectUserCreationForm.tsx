
import { Input } from "@/components/ui/input";
import { PasswordStrengthMeter } from "@/components/auth/shared/PasswordStrengthMeter";
import { validatePassword } from "./utils/validation";
import { UserRole } from "@/lib/roles";

interface DirectUserCreationFormProps {
  password: string;
  setPassword: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  passwordStrength: number;
  setPasswordStrength: (value: number) => void;
}

export function DirectUserCreationForm({
  password,
  setPassword,
  displayName,
  setDisplayName,
  passwordStrength,
  setPasswordStrength
}: DirectUserCreationFormProps) {
  return (
    <>
      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            // Calculate password strength (0-4 scale)
            const validationResult = validatePassword(e.target.value);
            // Count how many requirements are met for a simple strength calculation
            if (validationResult.requirements) {
              const requirementsMet = Object.values(validationResult.requirements).filter(Boolean).length;
              setPasswordStrength(Math.min(Math.floor(requirementsMet * 0.8), 4));
            } else {
              setPasswordStrength(0);
            }
          }}
          required
        />
        <PasswordStrengthMeter strength={passwordStrength} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="displayName" className="text-sm font-medium">
          Display Name (optional)
        </label>
        <Input
          id="displayName"
          type="text"
          placeholder="Enter display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
    </>
  );
}
