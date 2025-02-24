
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Users } from "lucide-react"

export function CreateTeam() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Debug: Log auth state when component mounts and when user changes
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      console.log("Auth state:", {
        isAuthenticated: !!user,
        userId: user?.id,
        session: data.session
      })
    }
    getSession()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!name.trim()) {
        throw new Error("Team name is required")
      }

      if (!user?.id) {
        throw new Error("User not authenticated")
      }

      // Debug: Log request details before making the request
      const { data: sessionData } = await supabase.auth.getSession()
      console.log("Making team creation request:", {
        userId: user.id,
        authHeaders: sessionData,
        requestData: {
          name: name.trim(),
          description: description.trim() || null,
          metadata: { visibility: 'private' },
          created_by: user.id
        }
      })

      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          metadata: { visibility: 'private' },
          created_by: user.id
        })
        .select('id, name, description')
        .single()

      if (error) {
        console.error('Supabase error details:', {
          error,
          statusCode: error.code,
          message: error.message,
          details: error.details
        })
        throw new Error(error.message)
      }

      console.log('Team created successfully:', data)

      toast({
        title: "Success",
        description: "Team created successfully",
        variant: "default"
      })

      setOpen(false)
      setName("")
      setDescription("")
    } catch (error: any) {
      console.error('Error creating team:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Users className="h-4 w-4" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team to manage access and collaboration.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description (optional)"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Team"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
