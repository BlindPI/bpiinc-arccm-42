
import { useState } from 'react';
import { FormField } from '../shared/FormField';
import { Button } from '@/components/ui/button';
import { SSOButtons } from '../shared/SSOButtons';
import { SecurityBadges } from '../shared/SecurityBadges';
import { PasswordRequirements } from './PasswordRequirements';
import { UserPlus } from 'lucide-react';

interface SignupFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export const SignupForm = ({ onSubmit }: SignupFormProps) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData.email, formData.password);
    } finally {
      setIsSubmitting(false);
    }
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
          required
        />
        <FormField
          id="signup-password"
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          autoComplete="new-password"
          required
        />
        <PasswordRequirements password={formData.password} />
      </div>
      
      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary-600 transition-colors shadow-md"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating Account...' : (
          <>
            <UserPlus className="h-4 w-4 mr-1" />
            Create Account
          </>
        )}
      </Button>

      <SSOButtons />
      <SecurityBadges />
    </form>
  );
}
