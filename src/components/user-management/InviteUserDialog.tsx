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

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("IT");
  const [isLoading, setIsLoading] = useState(false);
  const [directCreation, setDirectCreation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to invite users");

      if (directCreation) {
        // First verify permissions through our database function
        const { data: verificationData, error: verificationError } = await supabase.rpc(
          'create_new_user',
          {
            admin_user_id: user.id,
            email,
            initial_role: role,
            password,
            display_name: displayName || undefined
          }
        );

        if (verificationError) throw verificationError;
        
        if (!verificationData?.[0]?.success) {
          throw new Error(verificationData?.[0]?.message || 'Permission verification failed');
        }

        // Create user through Edge Function
        const { error: createError } = await supabase.functions.invoke('create-user', {
          body: {
            email,
            password,
            role,
            display_name: displayName
          }
        });

        if (createError) throw createError;

        toast.success("User created successfully");
      } else {
        // Generate a secure token using the database function
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('generate_invitation_token');

        if (tokenError) throw tokenError;

        // Insert the invitation
        const { error: inviteError } = await supabase
          .from('user_invitations')
          .insert({
            email,
            initial_role: role,
            invitation_token: tokenData,
            invited_by: user.id
          });

        if (inviteError) throw inviteError;

        // Send invitation email using edge function
        const { error: emailError } = await supabase.functions.invoke('send-invitation', {
          body: {
            email,
            invitationLink: `${window.location.origin}/accept-invitation?token=${tokenData}`
          }
        });

        if (emailError) throw emailError;

        toast.success("User invitation sent successfully");
      }

      setOpen(false);
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("IT");
      setDirectCreation(false);
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
                onChange={(e) => setEmail(e.target.value)}
                required
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
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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
            <Button type="submit" disabled={isLoading}>
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
