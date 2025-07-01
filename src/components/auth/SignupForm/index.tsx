
import { useState } from 'react';
import { FormField } from '../shared/FormField';
import { Button } from '@/components/ui/button';
import { SSOButtons } from '../shared/SSOButtons';
import { SecurityBadges } from '../shared/SecurityBadges';
import { PasswordRequirements } from './PasswordRequirements';
import { UserPlus, User, Mail, Building, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import { UserProfile } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    console.log("🔍 DEBUG: SignupForm - Attempting signup for:", formData.email);
    console.log("🔍 DEBUG: SignupForm - Profile data:", {
      display_name: formData.display_name,
      organization: formData.organization,
      job_title: formData.job_title
    });
    
    try {
      const profileData: Partial<UserProfile> = {
        display_name: formData.display_name,
        phone: formData.phone,
        organization: formData.organization,
        job_title: formData.job_title
      };
      
      await onSubmit(formData.email, formData.password, profileData);
      
      console.log("🔍 DEBUG: SignupForm - Signup successful");
      setSuccess("Account created successfully! Please check your email for verification if required.");
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        display_name: '',
        phone: '',
        organization: '',
        job_title: ''
      });
      
    } catch (error: any) {
      console.error("🔍 DEBUG: SignupForm - Signup error:", error);
      
      // Handle specific error messages
      let errorMessage = "Account creation failed. Please try again.";
      
      if (error.message) {
        if (error.message.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes("Unable to validate email address")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes("Signup requires a valid password")) {
          errorMessage = "Please enter a valid password (minimum 6 characters).";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-5">
        <div className="relative">
          <FormField
            id="signup-display-name"
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            autoComplete="name"
            required
          />
          <User className="absolute right-3 top-9 h-5 w-5 text-gray-400" />
        </div>
        
        <div className="relative">
          <FormField
            id="signup-email"
            label="Business Email"
            type="email"
            placeholder="Enter your business email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            autoComplete="email"
            required
          />
          <Mail className="absolute right-3 top-9 h-5 w-5 text-gray-400" />
        </div>
        
        <FormField
          id="signup-phone"
          label="Phone Number (Optional)"
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          autoComplete="tel"
        />
        
        <div className="relative">
          <FormField
            id="signup-organization"
            label="Organization / Company"
            type="text"
            placeholder="Enter your organization name"
            value={formData.organization}
            onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
            required
          />
          <Building className="absolute right-3 top-9 h-5 w-5 text-gray-400" />
        </div>
        
        <div className="relative">
          <FormField
            id="signup-job-title"
            label="Job Title"
            type="text"
            placeholder="Enter your job title"
            value={formData.job_title}
            onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
            required
          />
          <Briefcase className="absolute right-3 top-9 h-5 w-5 text-gray-400" />
        </div>
        
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
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Creating Account...
          </div>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Your Account
          </>
        )}
      </Button>

      <SSOButtons />
      <SecurityBadges />
    </form>
  );
}
