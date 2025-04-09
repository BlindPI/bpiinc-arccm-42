
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { UserCredentialsHoverCard } from "./UserCredentialsHoverCard";
import { Profile } from "@/types/user-management";

interface UserTableRowProps {
  profile: Profile & { compliance_status?: boolean };
  showCredentials: boolean;
}

export function UserTableRow({ profile, showCredentials }: UserTableRowProps) {
  // Convert date string to Date object
  const lastCheckDate = profile.updated_at ? new Date(profile.updated_at) : null;
  
  // Get compliance status indicator
  const getComplianceStatus = () => {
    if (profile.compliance_status === undefined) {
      return (
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
          <span>Unknown</span>
        </div>
      );
    }
    
    return profile.compliance_status ? (
      <div className="flex items-center">
        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
        <span>Compliant</span>
      </div>
    ) : (
      <div className="flex items-center">
        <XCircle className="h-4 w-4 text-red-500 mr-2" />
        <span>Non-compliant</span>
      </div>
    );
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{profile.display_name || 'No Name'}</div>
        <div className="text-sm text-muted-foreground">{profile.email || profile.id}</div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`${
            profile.role === 'SA' ? 'border-purple-200 bg-purple-50 text-purple-700' :
            profile.role === 'AD' ? 'border-blue-200 bg-blue-50 text-blue-700' :
            profile.role === 'AP' ? 'border-cyan-200 bg-cyan-50 text-cyan-700' :
            profile.role === 'IC' ? 'border-green-200 bg-green-50 text-green-700' :
            profile.role === 'IP' ? 'border-amber-200 bg-amber-50 text-amber-700' :
            'border-gray-200 bg-gray-50 text-gray-700'
          }`}
        >
          {profile.role}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          Active
        </Badge>
      </TableCell>
      <TableCell>
        {getComplianceStatus()}
      </TableCell>
      <TableCell>
        {lastCheckDate ? (
          format(lastCheckDate, 'MMM d, yyyy')
        ) : (
          <span className="text-muted-foreground">Never</span>
        )}
      </TableCell>
      {showCredentials && (
        <TableCell>
          <UserCredentialsHoverCard profile={profile} />
        </TableCell>
      )}
    </TableRow>
  );
}
