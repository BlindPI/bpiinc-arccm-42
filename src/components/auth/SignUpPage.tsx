
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedButton } from '@/design-system/components/atoms/EnhancedButton';
import { SmartInput } from '@/design-system/components/atoms/SmartInput';
import { CardLayout } from '@/design-system/components/molecules/CardLayout';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <CardLayout className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Get started with your new account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <SmartInput
            type="text"
            placeholder="Enter your full name"
            value={formData.displayName}
            onChange={handleChange('displayName')}
            leftIcon={<User />}
            label="Full Name"
            required
          />

          <SmartInput
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange('email')}
            leftIcon={<Mail />}
            label="Email Address"
            required
          />

          <SmartInput
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange('password')}
            leftIcon={<Lock />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            label="Password"
            required
          />

          <SmartInput
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            leftIcon={<Lock />}
            label="Confirm Password"
            required
          />

          <EnhancedButton
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            fullWidth
          >
            Create Account
          </EnhancedButton>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </CardLayout>
    </div>
  );
}
