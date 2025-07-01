
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Lock } from 'lucide-react';

export interface PasswordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export function PasswordField({ value, onChange, required = false }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor="signin-password" className="text-sm font-semibold text-gray-700">
          Password {required && <span className="text-red-500">*</span>}
        </label>
        <a href="#" className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
          Forgot password?
        </a>
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
        <Input
          id="signin-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          className="h-12 pl-10 pr-12 text-base bg-white/80 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg shadow-sm transition-all duration-200 hover:bg-white focus:bg-white"
          value={value}
          onChange={onChange}
          autoComplete="current-password"
          required={required}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-10 w-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-md transition-all duration-200"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
        </Button>
      </div>
    </div>
  );
}
