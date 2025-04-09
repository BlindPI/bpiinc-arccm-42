
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AcceptInvitationFormProps {
  token: string;
}

interface InvitationResult {
  success: boolean;
  message: string;
  email: string;
}

export function AcceptInvitationForm({ token }: AcceptInvitationFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      // Create the user account using the database function
      const { data, error: createError } = await supabase.rpc<InvitationResult, {invitation_token: string, password: string}>(
        'create_user_from_invitation',
        {
          invitation_token: token,
          password: password
        }
      );

      if (createError) throw createError;
      
      // Check if we have valid data
      if (!data || !data[0] || !data[0].success) {
        throw new Error(data?.[0]?.message || "Failed to create user");
      }

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data[0].email,
        password: password,
      });

      if (signInError) throw signInError;

      toast.success("Account created successfully! You are now logged in.");
      navigate("/");
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Accept Invitation</h1>
        <p className="text-sm text-muted-foreground">
          Please set your password to activate your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="confirm-password">
            Confirm Password
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </div>
  );
}
