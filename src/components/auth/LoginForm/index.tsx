
import { FormField } from '../shared/FormField';
import { PasswordField } from './PasswordField';
import { RememberMe } from './RememberMe';
import { Button } from '@/components/ui/button';
import { SSOButtons } from '../shared/SSOButtons';
import { SecurityBadges } from '../shared/SecurityBadges';
import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export const LoginForm = ({ onSubmit }: LoginFormProps) => {
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
          id="signin-email"
          label="Email Address"
          type="email"
          placeholder="Enter your business email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          autoComplete="email"
          required
        />
        <PasswordField
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
        />
        <RememberMe />
      </div>
      
      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-colors"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </Button>

      <SSOButtons />
      <SecurityBadges />
    </form>
  );
};
