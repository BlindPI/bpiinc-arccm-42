
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Roles from "./members/options/Roles"

export default function New({ team_id }: { team_id: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState({
    name: "",
    email: "",
    role: "member"
  })

  const saveMember = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id,
          email: member.email,
          name: member.name,
          role: member.role
        })

      if (error) throw error
      toast.success("Member added successfully")
      setOpen(false)
    } catch (error: any) {
      toast.error("Failed to add member")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={member.name}
              onChange={(e) => setMember({ ...member, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={member.email}
              onChange={(e) => setMember({ ...member, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Roles
              selected={member.role}
              setSelected={(value) => setMember({ ...member, role: value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={saveMember} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
