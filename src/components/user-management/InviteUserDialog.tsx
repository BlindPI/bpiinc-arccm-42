
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
import { useState } from "react";
import { UserRole } from "@/types/supabase-schema";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { validateEmail, validatePassword } from "./utils/validation";
import { DirectUserCreationForm } from "./DirectUserCreationForm";
import { RoleSelector } from "./RoleSelector";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedUserManagementService } from "@/services/user/enhancedUserManagementService";

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("IT");
  const [isLoading, setIsLoading] = useState(false);
  const [directCreation, setDirectCreation] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { data: currentUserProfile } = useProfile();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user?.id) throw new Error("You must be logged in to invite users");

      console.log('🔍 DEBUG: Starting invitation/creation process');
      console.log('🔍 DEBUG: Current user:', user.id);
      console.log('🔍 DEBUG: Current user profile role:', currentUserProfile?.role);
      console.log('🔍 DEBUG: Direct creation:', directCreation);

      if (directCreation) {
        const validationResult = validatePassword(password);
        if (!validationResult.valid) {
          toast.error("Password is not strong enough. Please choose a stronger password.");
          setIsLoading(false);
          return;
        }

        const result = await EnhancedUserManagementService.createUserDirectlyWithDebug(
          email, 
          password, 
          role, 
          displayName
        );
        
        if (!result.success) {
          throw new Error(result.message);
        }

        toast.success(result.message);
      } else {
        const result = await EnhancedUserManagementService.inviteUserWithDebug(
          email, 
          role, 
          user.id
        );
        
        if (!result.success) {
          throw new Error(result.message);
        }

        toast.success(result.message);
      }

      setOpen(false);
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("IT");
      setDirectCreation(false);
      setPasswordStrength(0);
    } catch (error: any) {
      console.error('🔍 DEBUG: Error in handleSubmit:', error);
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
            {(currentUserProfile?.role === 'AD' || currentUserProfile?.role === 'SA') && (
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
            )}
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
              <DirectUserCreationForm
                password={password}
                setPassword={setPassword}
                displayName={displayName}
                setDisplayName={setDisplayName}
                passwordStrength={passwordStrength}
                setPasswordStrength={setPasswordStrength}
              />
            )}
            <RoleSelector role={role} onRoleChange={setRole} />
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
