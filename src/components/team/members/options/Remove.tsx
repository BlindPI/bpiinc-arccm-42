
"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function Remove({ 
  user, 
  open, 
  onClose 
}: { 
  user: any
  open: boolean
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false)

  const removeMember = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('team_members')
        .update({ status: "removed" })
        .eq("id", user.id)

      if (error) throw error
      toast.success("User successfully removed from team")
      onClose()
    } catch (error: any) {
      toast.error("Failed to remove user")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {user.email || 'Member'} will no longer be part of the team and will no longer have access to team-related content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <Button 
            onClick={removeMember} 
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
