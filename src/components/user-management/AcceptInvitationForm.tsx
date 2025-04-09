
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { validatePassword } from "./utils/validation";
import { PasswordStrengthMeter } from "@/components/auth/shared/PasswordStrengthMeter";
import { PasswordRequirements } from "@/components/auth/SignupForm/PasswordRequirements";
import { Loader2 } from "lucide-react";

interface AcceptInvitationFormProps {
  invitationToken: string;
}

export function AcceptInvitationForm({ invitationToken }: AcceptInvitationFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        setIsLoading(false);
        return;
      }

      const passValidation = validatePassword(password);
      if (!passValidation.isValid) {
        toast.error(passValidation.message);
        setIsLoading(false);
        return;
      }

      // Verify invitation token
      const { data, error: tokenError } = await supabase.rpc('create_user_from_invitation', {
        invitation_token: invitationToken,
        password: password
      });

      if (tokenError || !data?.success) {
        throw new Error(tokenError?.message || data?.message || "Invalid invitation");
      }

      if (data.email) {
        // Sign in the user with their new credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: password
        });

        if (signInError) throw signInError;

        toast.success("Account created successfully. Welcome!");
        navigate("/");
      } else {
        throw new Error("Email not returned from account creation");
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || "Failed to accept invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
        <CardDescription>
          Create a password to complete your account setup
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Calculate password strength
                const { score } = validatePassword(e.target.value);
                setPasswordStrength(score);
              }}
              required
              autoComplete="new-password"
            />
            <PasswordStrengthMeter strength={passwordStrength} />
          </div>

          <PasswordRequirements password={password} />

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-destructive mt-1">Passwords do not match</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || passwordStrength < 3 || password !== confirmPassword}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
