
import { Profile } from "@/types/user-management";
import { ROLE_LABELS } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Beaker, CheckCircle } from "lucide-react";
import { UserCredentialsHoverCard } from "./UserCredentialsHoverCard";
import { UserRole } from "@/lib/roles";

interface UserTableRowProps {
  profile: Profile;
  showCredentials: boolean;
}

export function UserTableRow({ profile, showCredentials }: UserTableRowProps) {
  const hasPendingRequest = profile.role_transition_requests?.some(
    (request) => request.status === 'PENDING'
  );

  return (
    <TableRow className={profile.is_test_data ? 'bg-muted/20' : ''}>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">
            {profile.display_name || 'N/A'}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {profile.id}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {ROLE_LABELS[profile.role as UserRole]}
          </span>
          {hasPendingRequest && (
            <Badge variant="outline" className="text-xs">
              Pending Role Change
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Active</span>
        </div>
      </TableCell>
      <TableCell>
        {profile.is_test_data ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Beaker className="h-3 w-3" />
            Test Data
          </Badge>
        ) : (
          <Badge variant="default">Production</Badge>
        )}
      </TableCell>
      <TableCell>
        {new Date(profile.created_at).toLocaleDateString()}
      </TableCell>
      {showCredentials && (
        <TableCell>
          <UserCredentialsHoverCard profile={profile} />
        </TableCell>
      )}
    </TableRow>
  );
}
