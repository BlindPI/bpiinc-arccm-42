
import { useState } from 'react';
import { FormField } from '../shared/FormField';
import { Button } from '@/components/ui/button';
import { SSOButtons } from '../shared/SSOButtons';
import { SecurityBadges } from '../shared/SecurityBadges';
import { PasswordRequirements } from './PasswordRequirements';

interface SignupFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export const SignupForm = ({ onSubmit }: SignupFormProps) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData.email, formData.password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FormField
          id="signup-email"
          label="Email Address"
          type="email"
          placeholder="Enter your business email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          autoComplete="off"
        />
        <FormField
          id="signup-password"
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          autoComplete="new-password"
        />
        <PasswordRequirements password={formData.password} />
      </div>
      
      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-colors"
      >
        Get Started
      </Button>

      <SSOButtons />
      <SecurityBadges />
    </form>
  );
};
