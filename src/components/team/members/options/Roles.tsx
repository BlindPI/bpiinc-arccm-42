
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import type { TeamMember } from "@/types/user-management"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface RoleSelectorProps {
  selected: 'MEMBER' | 'ADMIN';
  member: TeamMember;
}

export function RoleSelector({ selected, member }: RoleSelectorProps) {
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  const updateRole = async (newRole: 'MEMBER' | 'ADMIN') => {
    try {
      setUpdating(true)
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', member.id)

      if (error) throw error

      toast({
        title: "Role updated",
        description: `Successfully updated role to ${newRole}`,
      })
    } catch (error: any) {
      console.error('Error updating role:', error)
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Select 
      defaultValue={selected} 
      disabled={updating}
      onValueChange={(value: 'MEMBER' | 'ADMIN') => updateRole(value)}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="MEMBER">Member</SelectItem>
        <SelectItem value="ADMIN">Admin</SelectItem>
      </SelectContent>
    </Select>
  )
}
