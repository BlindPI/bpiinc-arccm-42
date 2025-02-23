
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PasswordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showRequirements?: boolean;
  id?: string;
  label?: string;
}

export const PasswordField = ({ 
  value, 
  onChange, 
  showRequirements = false,
  id = "signin-password",
  label = "Password"
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-500" />
          {label}
        </div>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={showRequirements ? "Create a strong password" : "Enter your password"}
          value={value}
          onChange={onChange}
          required
          autoComplete={showRequirements ? "new-password" : "current-password"}
          className="h-12 text-base bg-white border-gray-300 focus:border-primary/80 focus:ring-primary/20 pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </div>
      {!showRequirements && (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary hover:text-primary/90">
              Forgot password?
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
