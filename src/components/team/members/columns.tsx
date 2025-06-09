
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Options } from "./options"
import { RoleSelector } from "./options/Roles"
import type { TeamMemberWithProfile } from "@/types/team-management"

export const columns: ColumnDef<TeamMemberWithProfile>[] = [
  {
    accessorKey: "display_name",
    header: "Name",
    cell: ({ row }) => {
      const member = row.original;
      return member.display_name || member.profile?.display_name || "Unknown";
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const member = row.original;
      return member.profile?.email || "No email";
    },
  },
  {
    accessorKey: "profile.role",
    header: "User Role",
    cell: ({ row }) => {
      const member = row.original;
      return member.profile?.role || "Unknown";
    },
  },
  {
    accessorKey: "role",
    header: "Team Role",
    cell: ({ row }) => {
      const member = row.original;
      return (
        <RoleSelector 
          selected={member.role} 
          member={member} 
        />
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "team_position",
    header: "Position",
    cell: ({ row }) => {
      return row.getValue("team_position") || "Team Member";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original;
      return <Options member={member} />;
    },
  },
];
