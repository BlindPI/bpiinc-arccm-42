
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import type { EnhancedTeam, SafeJson } from "@/types/user-management"
import { Loader2 } from "lucide-react"
import { safeTeamConversion } from "../utils/transformers"

interface TeamSettingsProps {
  team: EnhancedTeam;
  onUpdate: (team: EnhancedTeam) => void;
}

export function TeamSettings({ team, onUpdate }: TeamSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description || "")
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    team.metadata?.visibility || "private"
  )
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("teams")
        .update({
          name,
          description: description || null,
          metadata: {
            ...team.metadata,
            visibility,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", team.id)
        .select()
        .single()

      if (error) throw error

      // Convert the database response to EnhancedTeam while preserving existing properties
      const updatedTeam = safeTeamConversion({
        ...data,
        team_type: team.team_type,
        status: team.status,
        performance_score: team.performance_score,
        monthly_targets: team.monthly_targets,
        current_metrics: team.current_metrics,
        location: team.location,
        provider: team.provider,
        members: team.members
      })
      
      onUpdate(updatedTeam)
      
      toast({
        title: "Settings updated",
        description: "Your team settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="team-name">Team Name</Label>
        <Input
          id="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-description">Description</Label>
        <Textarea
          id="team-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your team's purpose..."
          className="h-24"
        />
      </div>

      <div className="space-y-2">
        <Label>Visibility</Label>
        <RadioGroup 
          value={visibility} 
          onValueChange={(value: 'public' | 'private') => setVisibility(value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="private" />
            <Label htmlFor="private">Private - Only visible to members</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" />
            <Label htmlFor="public">Public - Visible to all users</Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving changes...
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  )
}
