
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export function PasswordField({ value, onChange, required = false }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label htmlFor="signin-password" className="text-sm font-medium">
          Password
        </label>
        <a href="#" className="text-xs text-blue-600 hover:text-blue-800">
          Forgot password?
        </a>
      </div>
      <div className="relative">
        <Input
          id="signin-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          className="pr-10"
          value={value}
          onChange={onChange}
          autoComplete="current-password"
          required={required}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-10 w-10 text-gray-400 hover:text-gray-500"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
        </Button>
      </div>
    </div>
  );
}
