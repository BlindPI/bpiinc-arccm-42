
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PasswordStrengthMeter } from "@/components/auth/shared/PasswordStrengthMeter";
import zxcvbn from "zxcvbn";

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("IT");
  const [isLoading, setIsLoading] = useState(false);
  const [directCreation, setDirectCreation] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validatePassword = (password: string) => {
    if (!password) return false;
    const result = zxcvbn(password);
    setPasswordStrength(result.score);
    return result.score >= 3;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to invite users");

      if (directCreation) {
        if (!validatePassword(password)) {
          toast.error("Password is not strong enough. Please choose a stronger password.");
          setIsLoading(false);
          return;
        }

        const { data: response, error: functionError } = await supabase.functions.invoke(
          'create-user',
          {
            body: {
              email,
              password,
              role,
              display_name: displayName
            },
            headers: {
              'x-user-id': user.id
            }
          }
        );

        if (functionError) throw functionError;
        if (!response?.user) throw new Error('Failed to create user');

        toast.success("User created successfully");
      } else {
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('generate_invitation_token');

        if (tokenError) throw tokenError;

        const { error: inviteError } = await supabase
          .from('user_invitations')
          .insert({
            email,
            initial_role: role,
            invitation_token: tokenData,
            invited_by: user.id
          });

        if (inviteError) throw inviteError;

        const { error: emailError } = await supabase.functions.invoke(
          'send-invitation',
          {
            body: {
              email,
              invitationLink: `${window.location.origin}/accept-invitation?token=${tokenData}`
            }
          }
        );

        if (emailError) throw emailError;

        toast.success("User invitation sent successfully");
      }

      setOpen(false);
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("IT");
      setDirectCreation(false);
      setPasswordStrength(0);
    } catch (error: any) {
      console.error('Error inviting/creating user:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {directCreation ? "Create New User" : "Invite New User"}
            </DialogTitle>
            <DialogDescription>
              {directCreation 
                ? "Directly create a new user account in the system."
                : "Send an invitation email to add a new user to the system."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="direct-creation"
                checked={directCreation}
                onCheckedChange={setDirectCreation}
              />
              <label htmlFor="direct-creation" className="text-sm font-medium">
                Direct user creation
              </label>
            </div>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  if (value && !validateEmail(value)) {
                    toast.error("Please enter a valid email address");
                  }
                }}
                required
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              />
            </div>
            {directCreation && (
              <>
                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    required
                  />
                  <PasswordStrengthMeter strength={passwordStrength} />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="displayName" className="text-sm font-medium">
                    Display Name (optional)
                  </label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="grid gap-2">
              <label htmlFor="role" className="text-sm font-medium">
                Initial Role
              </label>
              <Select
                value={role}
                onValueChange={(value: UserRole) => setRole(value)}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (directCreation && passwordStrength < 3)}>
              {isLoading ? (
                directCreation ? "Creating..." : "Sending..."
              ) : (
                directCreation ? "Create User" : "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
