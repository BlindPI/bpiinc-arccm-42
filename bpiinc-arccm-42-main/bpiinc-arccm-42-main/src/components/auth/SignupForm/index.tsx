
import { useState } from 'react';
import { FormField } from '../shared/FormField';
import { Button } from '@/components/ui/button';
import { SSOButtons } from '../shared/SSOButtons';
import { SecurityBadges } from '../shared/SecurityBadges';
import { PasswordRequirements } from './PasswordRequirements';
import { UserPlus } from 'lucide-react';
import { UserProfile } from '@/types/auth';

interface SignupFormProps {
  onSubmit: (email: string, password: string, profileData?: Partial<UserProfile>) => Promise<void>;
}

export const SignupForm = ({ onSubmit }: SignupFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: '',
    phone: '',
    organization: '',
    job_title: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const profileData: Partial<UserProfile> = {
        display_name: formData.display_name,
        phone: formData.phone,
        organization: formData.organization,
        job_title: formData.job_title
      };
      await onSubmit(formData.email, formData.password, profileData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FormField
          id="signup-display-name"
          label="Display Name"
          type="text"
          placeholder="Enter your full name"
          value={formData.display_name}
          onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
          autoComplete="name"
          required
        />
        <FormField
          id="signup-email"
          label="Email Address"
          type="email"
          placeholder="Enter your business email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          autoComplete="email"
          required
        />
        <FormField
          id="signup-phone"
          label="Phone Number"
          type="tel"
          placeholder="Enter your phone number (optional)"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          autoComplete="tel"
        />
        <FormField
          id="signup-organization"
          label="Organization / Company"
          type="text"
          placeholder="Enter your organization name"
          value={formData.organization}
          onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
          required
        />
        <FormField
          id="signup-job-title"
          label="Job Title"
          type="text"
          placeholder="Enter your job title"
          value={formData.job_title}
          onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
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
