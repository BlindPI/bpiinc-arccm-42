
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordRequirements } from '@/components/auth/SignupForm/PasswordRequirements';
import { validatePassword } from './utils/validation';
import { toast } from 'sonner';

export function AcceptInvitationForm({ token }: { token: string }) {
  const { acceptInvitation } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState(() => validatePassword(''));

  useEffect(() => {
    // Validate password whenever it changes
    setPasswordValidation(validatePassword(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptInvitation) {
      toast.error('Invitation acceptance is not available');
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message || 'Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await acceptInvitation(token, password, displayName || undefined);
      
      if (!result.success) {
        toast.error(result.error || 'Failed to accept invitation');
        return;
      }
      
      toast.success('Invitation accepted successfully');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'An error occurred while accepting the invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            required
          />
          <PasswordRequirements password={password} />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1"
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
          )}
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
            Display Name (optional)
          </label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !passwordValidation.isValid || password !== confirmPassword}
      >
        {isSubmitting ? 'Accepting...' : 'Accept Invitation'}
      </Button>
    </form>
  );
}
