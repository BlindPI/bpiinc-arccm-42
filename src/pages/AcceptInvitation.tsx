
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { validatePassword } from '@/components/user-management/utils/validation';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useInvitations } from '@/hooks/auth/useInvitations';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROLE_LABELS } from '@/lib/roles';
import { UserRole } from '@/types/supabase-schema';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function AcceptInvitation() {
  const query = useQuery();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenValidating, setTokenValidating] = useState<boolean>(true);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [initialRole, setInitialRole] = useState<UserRole | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const { user } = useAuth();
  const { acceptInvitation, checkInvitationToken } = useInvitations({ setLoading });

  useEffect(() => {
    // Check if user is already logged in
    if (user) {
      navigate('/');
      return;
    }

    const tokenFromQuery = query.get('token');
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
      validateToken(tokenFromQuery);
    } else {
      setTokenValidating(false);
    }
  }, [query, user, navigate]);

  const validateToken = async (tokenToValidate: string) => {
    setTokenValidating(true);
    try {
      const result = await checkInvitationToken(tokenToValidate);
      setTokenValid(result.valid);
      setInvitedEmail(result.email);
      setInitialRole(result.initialRole as UserRole);
      
      if (!result.valid) {
        toast.error(result.error || 'Invalid invitation token');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setTokenValid(false);
      toast.error('Failed to validate invitation token');
    } finally {
      setTokenValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message || 'Password is not strong enough');
      return;
    }

    setLoading(true);
    try {
      const result = await acceptInvitation(token, password, displayName);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast.success('Invitation accepted! Welcome aboard!');
      navigate('/');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Evaluate password strength
    if (password) {
      const validation = validatePassword(password);
      if (validation.requirements) {
        let strength = 0;
        if (validation.requirements.hasMinLength) strength++;
        if (validation.requirements.hasUppercase) strength++;
        if (validation.requirements.hasLowercase) strength++;
        if (validation.requirements.hasNumber) strength++;
        if (validation.requirements.hasSpecialChar) strength++;
        
        setPasswordStrength(strength);
      } else {
        setPasswordStrength(0);
      }
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  if (tokenValidating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Validating Invitation</CardTitle>
            <CardDescription>Please wait while we validate your invitation...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>This invitation link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Please contact the person who invited you for a new invitation link.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/')}>
              Go to Home Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            {invitedEmail ? (
              <>
                You've been invited to join as a <strong>{ROLE_LABELS[initialRole as UserRole]}</strong>.
                Complete the form below to create your account.
              </>
            ) : (
              'Complete the form below to accept your invitation'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {invitedEmail && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={invitedEmail} disabled />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              {/* Password strength indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Password strength</span>
                  <span>{passwordStrength === 5 ? 'Strong' : passwordStrength >= 3 ? 'Good' : 'Weak'}</span>
                </div>
                <Progress value={(passwordStrength / 5) * 100} 
                  className={`h-1.5 ${
                    passwordStrength === 5 ? 'bg-success/20' : 
                    passwordStrength >= 3 ? 'bg-warning/20' : 
                    'bg-destructive/20'
                  }`} />
              </div>
              
              {password && passwordStrength < 3 && (
                <Alert variant="destructive" className="mt-2 py-2">
                  <AlertDescription className="text-xs">
                    Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || password !== confirmPassword || passwordStrength < 3}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
