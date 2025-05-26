
import { FormField } from '../shared/FormField';
import { PasswordField } from './PasswordField';
import { RememberMe } from './RememberMe';
import { Button } from '@/components/ui/button';
import { SSOButtons } from '../shared/SSOButtons';
import { SecurityBadges } from '../shared/SecurityBadges';
import { useState } from 'react';
import { LogIn, Mail } from 'lucide-react';

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
      <div className="space-y-5">
        <div className="relative">
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
          <Mail className="absolute right-3 top-9 h-5 w-5 text-gray-400" />
        </div>
        
        <PasswordField
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
        />
        
        <RememberMe />
      </div>
      
      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Signing In...
          </div>
        ) : (
          <>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In to Dashboard
          </>
        )}
      </Button>

      <SSOButtons />
      <SecurityBadges />
    </form>
  );
};
