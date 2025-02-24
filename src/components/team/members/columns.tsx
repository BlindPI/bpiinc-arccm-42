
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import Options from "./options"
import Roles from "./options/Roles"

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const onRoleChanged = async (value: string) => {
        try {
          const { error } = await supabase
            .from('team_members')
            .update({ role: value })
            .eq('id', row.original.id)

          if (error) throw error
          toast.success("Role updated successfully")
        } catch (error: any) {
          toast.error("Failed to update role")
          console.error(error)
        }
      }

      return (
        <Roles selected={row.original.role} setSelected={onRoleChanged} />
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <Options user={row.original} />
  }
]
